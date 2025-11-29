
export function useAudio(){
  const sounds={tap:'tap.wav',connect:'connect.wav',valid:'valid.wav',invalid:'invalid.wav',reshuffle:'reshuffle.wav',round:'round.wav',victory:'victory.wav'};
  function play(n){new Audio('/sounds/'+sounds[n]).play();}
  return {play};
}
