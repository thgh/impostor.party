export type Position = {
  top: number
  left: number
  rotate: number
}

export type Player = Position & {
  id: string
  rotate: number
  color: string
}
