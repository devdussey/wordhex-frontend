
import React from 'react';
import clsx from 'classnames';

export default function Tile({ letter, index, selected, onPress }:{
  letter:string;
  index:number;
  selected:boolean;
  onPress:()=>void;
}){
  return (
    <div
      onMouseDown={onPress}
      onTouchStart={onPress}
      className={clsx(
        'tile-base flex items-center justify-center select-none',
        selected && 'tile-selected'
      )}
    >
      {selected && <span className="tile-ripple" aria-hidden />}
      <span className="text-2xl font-bold">{letter}</span>
      {selected && (
        <span className="tile-index">{index}</span>
      )}
    </div>
  );
}
