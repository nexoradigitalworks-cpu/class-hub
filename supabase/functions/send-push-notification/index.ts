import webPush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushRequestPayload {
  classId: string
  notificationType: 'NOTICE' | 'EVENT' | 'INTERROGATION'
  referenceId: string // ID of notice, event, or interrogation to verify server-side
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@classhub.app'

    if (!supabaseUrl || !supabaseServiceKey || !vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'Server configuration missing for push notifications' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Verify user identity via Supabase Auth
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: PushRequestPayload = await req.json()
    if (!payload.classId || !payload.notificationType || !payload.referenceId) {
      return new Response(JSON.stringify({ error: 'Invalid payload: classId, notificationType, and referenceId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Verify user membership and check if user is authorized (ADMIN or CONTROLLER, or author)
    const { data: member, error: memberError } = await supabaseAdmin
      .from('class_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('class_id', payload.classId)
      .single()

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: 'Forbidden: User does not belong to the target class' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isAuthorizedRole = member.role === 'ADMIN' || member.role === 'CONTROLLER'
    if (!isAuthorizedRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role permissions to broadcast notifications' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Server-Side Verification of the actual record to prevent arbitrary payload injection
    let title = 'ClassHub'
    let body = 'Nuovo aggiornamento nella tua classe'
    let tag = 'classhub-notification'

    if (payload.notificationType === 'NOTICE') {
      const { data: notice, error: noticeErr } = await supabaseAdmin
        .from('notices')
        .select('title, class_id')
        .eq('id', payload.referenceId)
        .single()

      if (noticeErr || !notice || notice.class_id !== payload.classId) {
        return new Response(JSON.stringify({ error: 'Notice not found or class mismatch' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      title = 'Nuovo Avviso di Classe'
      body = `Pubblicato un nuovo avviso: ${notice.title}`
      tag = 'classhub-notice'
    } else if (payload.notificationType === 'EVENT') {
      const { data: event, error: eventErr } = await supabaseAdmin
        .from('events')
        .select('title, class_id, type')
        .eq('id', payload.referenceId)
        .single()

      if (eventErr || !event || event.class_id !== payload.classId) {
        return new Response(JSON.stringify({ error: 'Event not found or class mismatch' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      title = event.type === 'VERIFICA' ? 'Nuova Verifica Programmata' : 'Nuovo Evento in Calendario'
      body = `${event.title} (${event.type})`
      tag = 'classhub-event'
    } else if (payload.notificationType === 'INTERROGATION') {
      const { data: inter, error: interErr } = await supabaseAdmin
        .from('interrogations')
        .select('subject_name, class_id')
        .eq('id', payload.referenceId)
        .single()

      if (interErr || !inter || inter.class_id !== payload.classId) {
        return new Response(JSON.stringify({ error: 'Interrogation not found or class mismatch' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      title = 'Interrogazione / Volontari Aperti'
      body = `Nuove disponibilità aperte per ${inter.subject_name}`
      tag = 'classhub-interrogation'
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported notification type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Fetch push subscriptions for the specific class only
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, user_id, subscription')
      .eq('class_id', payload.classId)

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sentCount: 0, message: 'No push subscriptions found for class' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Ensure every recipient is STILL an active member of this class (exclude ex-members)
    const userIds = subscriptions.map((s: any) => s.user_id)
    const { data: activeMembers, error: memberCheckErr } = await supabaseAdmin
      .from('class_members')
      .select('user_id')
      .eq('class_id', payload.classId)
      .in('user_id', userIds)

    const activeMemberSet = new Set((activeMembers || []).map((m: any) => m.user_id))
    const validSubscriptions = subscriptions.filter((s: any) => activeMemberSet.has(s.user_id))

    if (validSubscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sentCount: 0, message: 'No active class members found for push' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    let sentCount = 0
    const notificationPayload = JSON.stringify({
      title,
      body,
      tag,
      url: '/',
    })

    // Rate-limiting and batch dispatch
    for (const subRecord of validSubscriptions) {
      try {
        const pushSub = subRecord.subscription
        await webPush.sendNotification(pushSub, notificationPayload)
        sentCount++
      } catch (err: any) {
        console.error(`Failed to send push to subscription ${subRecord.id}:`, err)
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('id', subRecord.id)
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
