import React from 'react';
import AgentTicketDetail from '../agent/AgentTicketDetail';

// Admin ticket detail uses the same component as agent
const AdminTicketDetail: React.FC = () => {
  return <AgentTicketDetail />;
};

export default AdminTicketDetail;
