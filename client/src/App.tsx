import type { AppType } from '../../server/src/server'
import { hc } from 'hono/client'
import { useEffect, useState } from 'react'
import './App.css'

const client = hc<AppType>('http://localhost:3000/')

const getHello = async () => {
  try {
    return await client.hello.$get({
      query: {
        name: 'Hono',
      },
    }).then(res => res.json())
  } catch (error) {
    console.log("GET HELLO ERROR", error);
  }
}

function App() {
  const [resp, setResp] = useState<string | null>(null)

  useEffect(() => {
    getHello().then(data => {
      setResp(JSON.stringify(data))
    })
  }, [])

  return (
    <>
      {resp}
    </>
  )
}

export default App
