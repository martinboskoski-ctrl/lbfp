export const isTopManagement = (user) => user?.department === 'top_management';
export const canManage = (user) => user?.isManager === true || isTopManagement(user);
