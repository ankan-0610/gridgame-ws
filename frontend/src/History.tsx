import React from 'react';

type HistoryProps = {
  history: any[];
};

const History: React.FC<HistoryProps> = ({ history }) => {

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold">History</h3>
      <ul className="text-sm">
        {history.map((item, index) => (
          <li key={index}>
            {item.timestamp}: Player {item.clientId} updated ({item.row}, {item.col}) to "{item.character}"
          </li>
        ))}
      </ul>
    </div>
  );
};

export default History;