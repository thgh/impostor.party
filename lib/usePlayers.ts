import { useEffect, useReducer, useRef, useState } from 'react'
import { Player } from './types'

const apiKey = 'rKe9hvA5lhH4JrfTowpSOAzXFLomieQfa9YtjU1f' //Demo key, Change this to yours
const channelId = 1

export function usePlayers(meRef) {
  const forceUpdate = useReducer((x) => x + 1, 0)[1]
  const players = useRef(new Map<string, Player>())
  useEffect(() => {
    let interval
    let me
    const [gameId] = window.location.pathname.split('/').filter(Boolean)
    const socket = new WebSocket(
      `wss://connect.websocket.in/v3/${gameId}?api_key=${apiKey}`
    )
    socket.addEventListener('open', function (event) {
      // Ask other players
      socket.send('"hi"')

      // Send my initial position
      me = meRef.current
      socket.send(JSON.stringify({ me }))

      // Keep streaming my position
      interval = setInterval(() => {
        if (me !== meRef.current) {
          me = meRef.current
          socket.send(JSON.stringify({ me }))
        }
      }, 20)
    })
    socket.addEventListener('message', function (event) {
      const data = JSON.parse(event.data)
      if (data === 'hi') {
        me = meRef.current
        socket.send(JSON.stringify({ me }))
      }
      if (data.me) {
        players.current.set(data.me.id, data.me)
        forceUpdate()
      }
    })

    return () => {
      clearInterval(interval)
      socket.close()
    }
  }, [])

  return Array.from(players.current.values())
}
