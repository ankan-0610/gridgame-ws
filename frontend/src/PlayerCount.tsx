import React from 'react';

type PlayerCountProps = {
  count: number;
};

const PlayerCount: React.FC<PlayerCountProps> = ({ count }) => {
  return <div className="text-white text-lg">Players Online: {count}</div>;
};

export default PlayerCount;