
export class OppAI {
  onEmit: (event: any) => void;
  words: string[];

  constructor(onEmit: (event: any) => void){
    this.onEmit = onEmit;
    this.words = ["STAR","LINE","TONE","MAP","AXE"];
  }
  takeTurn(){
    const w = this.words[Math.floor(Math.random()*this.words.length)];
    const score = w.length;
    this.onEmit({type:"OPPSUBMIT", word:w, score});
  }
}
