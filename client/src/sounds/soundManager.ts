import { Howl, Howler } from 'howler'

// We use free CDN audio for sounds — no assets needed
const CDN = 'https://assets.mixkit.co/active_storage/sfx'

class SoundManager {
  private sounds: Record<string, Howl> = {}
  private _muted = false
  private _volume = 0.7

  private define(key: string, src: string[], loop = false) {
    this.sounds[key] = new Howl({ src, loop, volume: this._volume, preload: false })
  }

  init() {
    // Ambient night loop
    this.define('ambience', [`${CDN}/ambient/midnight-ambience.mp3`], true)
    // Day phase
    this.define('day',      [`${CDN}/ambient/campfire-crackle.mp3`], true)
    // Dramatic reveal
    this.define('reveal',   [`${CDN}/misc/dramatic-chord.mp3`])
    // Card flip
    this.define('flip',     [`${CDN}/misc/card-flip.mp3`])
    // Gunshot / elimination
    this.define('eliminate',  [`${CDN}/weapons/gunshot.mp3`])
    // Vote cast
    this.define('vote',     [`${CDN}/misc/button-click.mp3`])
    // Win — village
    this.define('villageWin', [`${CDN}/misc/victory-fanfare.mp3`])
    // Win — mafia
    this.define('mafiaWin',   [`${CDN}/misc/evil-laugh.mp3`])
    // Tick (timer)
    this.define('tick',     [`${CDN}/misc/clock-tick.mp3`])
    // Phase transition
    this.define('phase',    [`${CDN}/misc/transition.mp3`])
  }

  play(key: string) {
    if (this._muted) return
    const s = this.sounds[key]
    if (s) { s.stop(); s.play() }
  }

  stop(key: string) {
    this.sounds[key]?.stop()
  }

  stopAll() {
    Object.values(this.sounds).forEach(s => s.stop())
  }

  setMuted(v: boolean) {
    this._muted = v
    Howler.mute(v)
  }

  setVolume(v: number) {
    this._volume = v
    Howler.volume(v)
  }

  get muted() { return this._muted }
  get volume() { return this._volume }
}

export const sound = new SoundManager()
