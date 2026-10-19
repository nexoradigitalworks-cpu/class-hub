import webPush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushRequestPayload {
  classId: string
  notificationType: 'NOTICE' | 'EVENT' | 'INTERROGATION' | 'MATERIAL' | 'SURVEY' | 'REPRESENTATION' | 'REMINDER' | 'TEST'
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'FULL_SLOTS' | 'VOLUNTEER_REMINDER' | 'REMINDER' | 'TEST'
  referenceId?: string
  targetUserId?: string
  customTitle?: string
  customBody?: string
  customTag?: string
  customUrl?: string
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
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BKIAkKVNFhGQeVHr1eIAysArp3E0226kZ52R-UUC1RFt5Jx8yFh_n2hHClGPuDs2QX0PWqBY9FuaoA7RJPO-m58'
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'ZOMgPfaiI7JANO6fhslJujpPSnKlmNLE9UhIGXB1oWY'
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:nexora.digitalworks@gmail.com'

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase server URL or service key missing' }), {
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
    if (!payload.classId || !payload.notificationType) {
      return new Response(JSON.stringify({ error: 'Invalid payload: classId and notificationType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Authorization check
    const isTestNotification = payload.notificationType === 'TEST' && (!payload.targetUserId || payload.targetUserId === user.id)
    const isPersonalReminder = payload.notificationType === 'REMINDER' && payload.targetUserId === user.id

    if (!isTestNotification && !isPersonalReminder) {
      // User must belong to class
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

      // Check role permissions: volunteers or authors can trigger slots full, Admins/Controllers can broadcast
      const isPrivileged = member.role === 'ADMIN' || member.role === 'CONTROLLER'
      const isSlotOrReminderAction = payload.action === 'FULL_SLOTS' || payload.action === 'VOLUNTEER_REMINDER'
      if (!isPrivileged && !isSlotOrReminderAction && payload.notificationType !== 'REMINDER') {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role permissions to broadcast notifications' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 3. Construct Notification Title, Body, Tag, and URL
    let title = payload.customTitle || 'ClassHub'
    let body = payload.customBody || 'Nuovo aggiornamento nella tua classe'
    let tag = payload.customTag || 'classhub-notification'
    let url = payload.customUrl || '/'
    let preferenceKey = 'avvisi'
    const action = payload.action || 'CREATE'

    if (payload.notificationType === 'TEST') {
      title = 'ClassHub — Test Notifiche Push'
      body = 'Le notifiche push web sono attive e funzionanti sul tuo dispositivo!'
      tag = 'classhub-test'
      url = '/account'
      preferenceKey = 'avvisi'
    } else if (payload.notificationType === 'NOTICE') {
      preferenceKey = 'avvisi'
      url = '/notices'
      tag = 'classhub-notice'
      if (payload.referenceId) {
        const { data: notice } = await supabaseAdmin
          .from('notices')
          .select('title')
          .eq('id', payload.referenceId)
          .maybeSingle()
        const noticeTitle = notice?.title || ''
        if (action === 'DELETE') {
          title = '[Annullato] Avviso di Classe rimosso'
          body = noticeTitle ? `L'avviso "${noticeTitle}" è stato rimosso.` : 'Un avviso è stato eliminato.'
        } else if (action === 'UPDATE') {
          title = '[Modificato] Avviso di Classe'
          body = noticeTitle ? `Aggiornato: ${noticeTitle}` : 'Un avviso di classe è stato aggiornato.'
        } else {
          title = 'Nuovo Avviso di Classe'
          body = noticeTitle ? `Pubblicato: ${noticeTitle}` : 'Pubblicato un nuovo avviso nella tua classe.'
        }
      }
    } else if (payload.notificationType === 'EVENT') {
      url = '/calendar'
      tag = 'classhub-event'
      if (payload.referenceId) {
        const { data: event } = await supabaseAdmin
          .from('events')
          .select('title, type, is_personal, author_id')
          .eq('id', payload.referenceId)
          .maybeSingle()

        if (event?.is_personal) {
          // Strictly personal event: never expose to other students
          payload.targetUserId = event.author_id
        }

        const isVerifica = event?.type === 'VERIFICA'
        preferenceKey = isVerifica ? 'verifiche' : 'eventi'
        const eventTitle = event?.title || (isVerifica ? 'Verifica' : 'Evento')

        if (action === 'DELETE') {
          title = `[Annullato] ${isVerifica ? 'Verifica Annullata' : 'Evento Annullato'}`
          body = `${eventTitle} è stato annullato.`
        } else if (action === 'UPDATE') {
          title = `[Modificato] ${isVerifica ? 'Verifica Spostata/Modificata' : 'Evento Aggiornato'}`
          body = `${eventTitle} ha subito delle modifiche in calendario.`
        } else {
          title = isVerifica ? 'Nuova Verifica in Calendario' : 'Nuovo Evento in Calendario'
          body = `${eventTitle} (${event?.type || 'Calendario'})`
        }
      }
    } else if (payload.notificationType === 'INTERROGATION') {
      preferenceKey = 'interrogazioni'
      url = '/interrogations'
      tag = 'classhub-interrogation'
      let subjectName = ''
      if (payload.referenceId) {
        const { data: inter } = await supabaseAdmin
          .from('interrogations')
          .select('subject_name, title')
          .eq('id', payload.referenceId)
          .maybeSingle()
        subjectName = inter?.subject_name || inter?.title || 'Materia'
      }

      if (action === 'FULL_SLOTS') {
        title = 'Posti Volontari Esauriti'
        body = `Tutti i posti per l'interrogazione di ${subjectName || 'classe'} sono stati occupati.`
      } else if (action === 'VOLUNTEER_REMINDER') {
        title = 'Promemoria Volontari Interrogazione'
        body = `Ci sono ancora posti disponibili per ${subjectName || 'la prova orale'}. Prenotati ora!`
      } else if (action === 'DELETE') {
        title = '[Annullata] Interrogazione Annullata'
        body = `L'interrogazione di ${subjectName || 'classe'} è stata annullata.`
      } else if (action === 'UPDATE') {
        title = '[Modificata] Interrogazione Aggiornata/Rinviata'
        body = `L'interrogazione di ${subjectName || 'classe'} è stata modificata o rinviata.`
      } else {
        title = 'Nuova Interrogazione Programmata'
        body = `Aperte prenotazioni volontari per ${subjectName || 'la prova orale'}.`
      }
    } else if (payload.notificationType === 'MATERIAL') {
      preferenceKey = 'materiali'
      url = '/materials'
      tag = 'classhub-material'
      title = 'Nuovo Materiale Didattico'
      body = payload.customBody || 'È stato caricato un nuovo appunto o materiale di studio.'
    } else if (payload.notificationType === 'SURVEY') {
      preferenceKey = 'sondaggi'
      url = '/surveys'
      tag = 'classhub-survey'
      title = 'Nuovo Sondaggio di Classe'
      body = payload.customBody || 'È stato aperto un nuovo sondaggio: esprimi il tuo voto!'
    } else if (payload.notificationType === 'REPRESENTATION') {
      preferenceKey = 'sondaggi'
      url = '/representation'
      tag = 'classhub-representation'
      title = 'Nuova Comunicazione Rappresentanti'
      body = payload.customBody || 'È disponibile una nuova proposta o decisione dei rappresentanti.'
    } else if (payload.notificationType === 'REMINDER') {
      preferenceKey = 'promemoria'
      url = payload.customUrl || '/calendar'
      tag = payload.customTag || 'classhub-reminder'
      title = payload.customTitle || 'Promemoria Impegno Scolastico'
      body = payload.customBody || 'Hai una verifica o interrogazione programmata a breve.'
    }

    // 4. Fetch push subscriptions
    let query = supabaseAdmin
      .from('push_subscriptions')
      .select('id, user_id, subscription, preferences')
      .eq('class_id', payload.classId)

    if (payload.targetUserId) {
      query = query.eq('user_id', payload.targetUserId)
    }

    const { data: subscriptions, error: subError } = await query

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sentCount: 0, message: 'No push subscriptions found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Ensure recipient is an active member
    const userIds = Array.from(new Set(subscriptions.map((s: any) => s.user_id)))
    const { data: activeMembers } = await supabaseAdmin
      .from('class_members')
      .select('user_id')
      .eq('class_id', payload.classId)
      .in('user_id', userIds)

    const activeMemberSet = new Set((activeMembers || []).map((m: any) => m.user_id))
    
    // Filter by active membership and user category preferences
    const validSubscriptions = subscriptions.filter((s: any) => {
      if (!activeMemberSet.has(s.user_id)) return false
      // Check user preferences
      if (s.preferences && typeof s.preferences === 'object') {
        const prefValue = s.preferences[preferenceKey]
        if (prefValue === false) {
          return false
        }
      }
      return true
    })

    if (validSubscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sentCount: 0, message: 'No active subscribers matching preference filter' }), {
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
      url,
      notificationType: payload.notificationType,
      referenceId: payload.referenceId
    })

    // Batch dispatch
    for (const subRecord of validSubscriptions) {
      try {
        const pushSub = subRecord.subscription
        await webPush.sendNotification(pushSub, notificationPayload)
        sentCount++
      } catch (err: any) {
        console.error(`Failed to send push to subscription ${subRecord.id}:`, err)
        // Cleanup expired or invalidated endpoints
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
