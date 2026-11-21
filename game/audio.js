let context,muted=false;
export function unlockAudio(){context ||= new (window.AudioContext||window.webkitAudioContext)();context.resume();}
export function toggleMute(){muted=!muted;return muted;}
export function sound(kind){
  if(!context||muted)return;
  const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
  oscillator.connect(gain);gain.connect(context.destination);
  const notes={shot:[130,35,.12,'sawtooth'],hit:[85,30,.18,'square'],pickup:[540,950,.2,'sine'],siren:[620,920,.18,'triangle'],enter:[240,120,.14,'triangle']};
  const [from,to,length,type]=notes[kind]||notes.pickup;
  oscillator.type=type;oscillator.frequency.setValueAtTime(from,now);oscillator.frequency.exponentialRampToValueAtTime(to,now+length);
  gain.gain.setValueAtTime(kind==='shot'?.09:.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+length);
  oscillator.start(now);oscillator.stop(now+length);
}
