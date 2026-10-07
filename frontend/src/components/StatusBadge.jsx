import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || 'WAITING').toUpperCase();

  switch (normalized) {
    case 'SERVING':
      return (
        <span className="badge badge-serving">
          Serving Now
        </span>
      );
    case 'WAITING':
      return (
        <span className="badge badge-waiting">
          Waiting
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="badge badge-completed">
          Completed
        </span>
      );
    case 'LEFT':
      return (
        <span className="badge badge-cancelled">
          Left Queue
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="badge badge-cancelled">
          Cancelled
        </span>
      );
    default:
      return <span className="badge">{status}</span>;
  }
};

export default StatusBadge;
