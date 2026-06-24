import { useAuth } from '../context/AuthContext';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom'; 

const Navbar = () => {
    const { user, logout } = useAuth();

    console.log("Current User Data:", user);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            <div className="text-lg font-medium text-gray-800 hidden md:block">
                Welcome back, {user?.user?.username || 'User'}
            </div>
            
            <Link to="/" className="text-lg font-bold text-primary-600 md:hidden hover:text-primary-700 transition-colors">
                MailMind AI
            </Link>

            <div className="flex items-center space-x-4">
                <button
                    onClick={logout}
                    className="flex items-center text-gray-600 hover:text-red-500 transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;