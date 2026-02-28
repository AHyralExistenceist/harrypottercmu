import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string>('')

  const signUp = async () => {
    setMsg('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return setMsg(error.message)
    setMsg('회원가입 요청 완료! (이메일 인증을 켰다면 메일 확인 필요)')
  }

  const signIn = async () => {
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setMsg(error.message)
    setMsg('로그인 성공!')
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', display: 'grid', gap: 8 }}>
      <h2>로그인 / 회원가입</h2>

      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={signIn}>로그인</button>
        <button onClick={signUp}>회원가입</button>
      </div>

      {msg && <p>{msg}</p>}
    </div>
  )
}