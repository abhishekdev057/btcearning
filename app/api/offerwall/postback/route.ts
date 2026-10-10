import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function timingSafeEqualStrings(a: string, b: string) {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function verifySignature(
  subId: string,
  transId: string,
  reward: string,
  secret: string,
  signature: string | null,
  signature2: string | null,
) {
  if (signature2) {
    const expected = createHmac('sha256', secret).update(`${subId}${transId}${reward}`).digest('hex')
    if (timingSafeEqualStrings(expected, signature2)) return true
  }

  if (signature) {
    const expected = createHash('md5').update(`${subId}${transId}${reward}${secret}`).digest('hex')
    if (timingSafeEqualStrings(expected, signature)) return true
  }

  return false
}

async function handlePostback(params: URLSearchParams) {
  const secret = process.env.OFFERWALLAPI_SECRET_KEY
  if (!secret) {
    console.error('[offerwall postback] OFFERWALLAPI_SECRET_KEY is not configured')
    return new NextResponse('error', { status: 500 })
  }

  const subId = params.get('subId')
  const transId = params.get('transId')
  const reward = params.get('reward')
  const status = params.get('status')
  const offerType = params.get('offer_type')
  const offerName = params.get('offer_name')
  const signature = params.get('signature')
  const signature2 = params.get('signature2')

  if (!subId || !transId || !reward || !status) {
    return new NextResponse('error', { status: 400 })
  }

  if (!verifySignature(subId, transId, reward, secret, signature, signature2)) {
    console.warn('[offerwall postback] signature mismatch', { subId, transId })
    return new NextResponse('error', { status: 401 })
  }

  const rewardSatoshi = Math.round(Number(reward))
  const statusNum = Number(status)

  if (!Number.isFinite(rewardSatoshi) || rewardSatoshi <= 0) {
    return new NextResponse('error', { status: 400 })
  }

  if (statusNum !== 1 && statusNum !== 2) {
    return new NextResponse('error', { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase.rpc('process_offerwall_postback', {
    p_user_id: subId,
    p_trans_id: transId,
    p_reward_satoshi: rewardSatoshi,
    p_status: statusNum,
    p_offer_type: offerType,
    p_offer_name: offerName,
  })

  if (error) {
    console.error('[offerwall postback] RPC failed', error)
    return new NextResponse('error', { status: 500 })
  }

  return new NextResponse('ok', { status: 200 })
}

export async function GET(request: NextRequest) {
  return handlePostback(request.nextUrl.searchParams)
}

export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams.size > 0
    ? request.nextUrl.searchParams
    : new URLSearchParams(await request.text())

  return handlePostback(params)
}
