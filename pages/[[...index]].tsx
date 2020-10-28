import React, { useEffect, useReducer, useRef, useState } from 'react'
import Head from 'next/head'

import { Player, Position } from '../lib/types'
import { usePlayers } from '../lib/usePlayers'

const WORLD_TOP = 0
const WORLD_BOTTOM = 1000
const WORLD_LEFT = 0
const WORLD_RIGHT = 1000
const PLAYER_SIZE = 50 //50
const PLAYER_SPEED = 5
const ZOOM = 2

const WORLD_WIDTH = WORLD_RIGHT - WORLD_LEFT
const WORLD_HEIGHT = WORLD_BOTTOM - WORLD_TOP
const WORLD_CENTER_LEFT = (WORLD_RIGHT + WORLD_LEFT) / 2
const WORLD_CENTER_TOP = (WORLD_BOTTOM + WORLD_TOP) / 2

export function useClientside() {
  const [clientside, setClientside] = useState({
    state: 0,
    userId: '',
    gameId: '',
  })

  useEffect(() => {
    const [gameId, userId] = window.location.pathname.split('/').filter(Boolean)
    if (gameId && userId) {
      setClientside({
        state: 1,
        userId,
        gameId,
      })
    } else {
      setClientside({
        ...clientside,
        state: 2,
      })
    }
  }, [])
  return clientside
}

export default function Home() {
  const client = useClientside()
  return (
    <div className="container">
      <Head>
        <title>Impostor.party</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1 className="title">{client.userId || 'Impostor'}</h1>
        {client.state === 1 ? (
          <World {...client} />
        ) : client.state === 2 ? (
          <div>
            <a href="/testgame/me">me player</a>
            <br />
            <a href="/testgame/you">you player</a>
            <br />
            <a href="/testgame/third">third player</a>
          </div>
        ) : null}
      </main>
      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
          color: white;
          background: black;
          overflow: hidden;
        }
        h1 {
          position: absolute;
          left: 0;
          right: 0;
          opacity: 0.2;
          margin: 1em;
          font-weight: 100;
          font-size: 10vh;
          text-align: center;
        }

        * {
          box-sizing: border-box;
        }
        .zoom-outer {
          transition: transform 1s ease-out;
          width: 100vw;
          height: 100vh;
        }
        .zoom-inner {
          position: relative;
          border: 10px solid rgba(255, 255, 255, 0.1);
          --size: 1000px;
          width: var(--size);
          height: var(--size);
        }
        .world {
          --size: 1000px;
          position: absolute;
          top: -10px;
          left: -10px;
          width: var(--size);
          height: var(--size);
          background: rgba(0, 100, 200, 0.2);
          user-select: none;
          z-index: 1;
        }
        .debug {
          position: fixed;
          z-index: 3;
          bottom: 0;
          left: 0;
          padding: 10px;
          width: 50vw;
          height: 50vh;
          color: white;
          pointer-events: none;
          background: rgba(255, 0, 0, 0.2);
        }
        .player {
          position: absolute;
          top: 0;
          left: 0;
          width: ${PLAYER_SIZE}px;
          height: ${PLAYER_SIZE}px;
          display: flex;
          flex-direction: column;
          place-items: center;
          text-align: center;
        }
        .avatar {
          border-top-left-radius: 99px;
          border-top-right-radius: 99px;
          width: ${PLAYER_SIZE}px;
          height: ${PLAYER_SIZE}px;
          background: white;
          transition: transform 0.4s;
        }
        .name {
          position: absolute;
          top: -2em;
          left: -2em;
          right: -2em;
          text-align: center;
        }
      `}</style>
    </div>
  )
}

// function Zoom({ children }) {
//   const [level, setLevel] = useState(1)
//   const [zoom, setZoom] = useState({ top: 10, left: 20 })
//   useEffect(() => {}, [])
//   return (
//     <div className="zoom-outer" style={{ transformOrigin: `${top} ${left}` }}>
//       <div className="zoom-inner">{children}</div>
//     </div>
//   )
// }

function World({ userId }: { userId: string }) {
  const [win, setWin] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [zoom, setZoom] = useState({ top: 10, left: 20 })
  useEffect(() => {
    const set = () =>
      setWin({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', set, false)
    return () => window.removeEventListener('resize', set, false)
  }, [])
  // const level =
  //   0.5 * Math.min(win.width / WORLD_WIDTH, win.height / WORLD_HEIGHT)
  const level =
    ZOOM * Math.min(win.width / WORLD_WIDTH, win.height / WORLD_HEIGHT)

  const forceUpdate = useReducer((x) => x + 1, 0)[1]
  const meRef = useRef<Player>({
    id: userId,
    top: within(WORLD_TOP, WORLD_BOTTOM),
    left: within(WORLD_LEFT, WORLD_RIGHT),
    rotate: 0,
    color: 'red',
  })
  const [_top, _left] = useDirection()
  const players = usePlayers(meRef)

  // Move myself
  useEffect(() => {
    if (!_top && !_left) return
    let rotate = (Math.atan2(_top, _left) / Math.PI) * 180 + 90
    const me = meRef.current
    const diff = mod(rotate - me.rotate, 360)
    if (diff > 180) {
      rotate = me.rotate + diff - 360
    } else {
      rotate = me.rotate + diff
    }
    console.log('me', me.rotate, '+', diff, '=', rotate)
    // console.log('start effect', _top, _left, effect)
    let timeout = 0
    ;(function animate() {
      const me = meRef.current
      if (timeout < 0) {
        // console.warn('after effect')
        return
      }
      timeout = requestAnimationFrame(animate)
      let top = me.top + _top * PLAYER_SPEED
      let left = me.left + _left * PLAYER_SPEED
      if (top < WORLD_TOP) top = WORLD_TOP
      if (left < WORLD_LEFT) left = WORLD_LEFT
      if (top + PLAYER_SIZE > WORLD_BOTTOM) top = WORLD_BOTTOM - PLAYER_SIZE
      if (left + PLAYER_SIZE > WORLD_RIGHT) left = WORLD_RIGHT - PLAYER_SIZE
      meRef.current = { ...me, rotate, top, left }
      forceUpdate()
    })()
    return () => {
      cancelAnimationFrame(timeout)
      timeout = -1
      // console.log('stop effect', _top, _left, effect)
    }
  }, [_top, _left])

  // useAnimationFrame(() => {
  //   console.log('top lef', top, left)
  //   if (top || left) {
  //     setMe((me) => ({ ...me, top: me.top + top, left: me.left + left }))
  //   }
  // }, [top, left])
  const me = meRef.current
  return (
    <div>
      <div className="debug">world {level}</div>
      <div
        className="zoom-outer"
        style={{
          transform: ` translate(${-WORLD_CENTER_LEFT}px,${-WORLD_CENTER_TOP}px)  scale(${level})  translate(${
            win.width / 2 / level
          }px,${win.height / 2 / level}px) translate(${
            WORLD_CENTER_LEFT / level - me.left
          }px,${WORLD_CENTER_TOP / level - me.top}px) `,
          transformOrigin: '0 0',
        }}
      >
        <div className="zoom-inner">
          <div className="world">
            {players.concat(me).map((player) => (
              <div
                className="player"
                key={player.id}
                style={{
                  transform: position(player),
                }}
              >
                <div
                  className="avatar"
                  style={{
                    transform: `rotate(${player.rotate}deg)`,
                    backgroundColor: player.color,
                  }}
                ></div>
                <div className="name">{player.id || '?'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function position({ top = 50, left = 50 }: Position) {
  return `translate(${left}px,${top}px)`
}

function useDirection() {
  const [keyVertical, setKeyVertical] = useState(0)
  const [keyHorizontal, setKeyHorizontal] = useState(0)

  const downHandler = (evt) => {
    switch (evt.code) {
      case 'KeyW':
      case 'ArrowUp':
        setKeyVertical(-1)
        evt.preventDefault()
        break
      case 'KeyS':
      case 'ArrowDown':
        setKeyVertical(1)
        evt.preventDefault()
        break
      case 'KeyA':
      case 'ArrowLeft':
        setKeyHorizontal(-1)
        evt.preventDefault()
        break
      case 'KeyD':
      case 'ArrowRight':
        setKeyHorizontal(1)
        evt.preventDefault()
    }
  }

  // If released code is our target code then set to false
  const upHandler = ({ code }) => {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        if (keyVertical === -1) setKeyVertical(0)
        break
      case 'KeyS':
      case 'ArrowDown':
        if (keyVertical === 1) setKeyVertical(0)
        break
      case 'KeyA':
      case 'ArrowLeft':
        if (keyHorizontal === -1) setKeyHorizontal(0)
        break
      case 'KeyD':
      case 'ArrowRight':
        if (keyHorizontal === 1) setKeyHorizontal(0)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, [keyVertical, keyHorizontal]) // Empty array ensures that effect is only run on mount and unmount

  if (keyVertical && keyHorizontal) {
    return [keyVertical * 0.70710678118, keyHorizontal * 0.70710678118]
  }

  return [keyVertical, keyHorizontal]
}
function useAnimationFrame(callback, deps = []) {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = useRef<any>()
  const previousTimeRef = useRef<any>()

  const animate = (time) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, deps) // Make sure the effect runs only once
}
function mod(n, m) {
  return ((n % m) + m) % m
}
function within(min: number, max: number) {
  return Math.random() * (max - min) + min
}
