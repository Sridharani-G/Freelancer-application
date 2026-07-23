export const getRoleDashboardPath = (role) => {
    switch (role) {
        case 'admin':
            return '/admin';
        case 'client':
            return '/client/dashboard';
        case 'freelancer':
            return '/freelancer/dashboard';
        default:
            return '/';
    }
};
