// Main App Component
import {ComposePage} from "./components/compose-page.tsx";
import {BackupPage} from "./components/backup-page.tsx";
import {useState} from "react";

export default function App() {
    const [activeTab, setActiveTab] = useState('compose');

    const renderContent = () => {
        switch (activeTab) {
            case 'compose':
                return <ComposePage/>;
            case 'backup':
                return <BackupPage/>;
            default:
                return <ComposePage/>;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab}/>
            <main className="flex-grow">
                {renderContent()}
            </main>
        </div>
    );
}

// Navigation Bar
const Navbar = ({activeTab, setActiveTab}) => {
    return (
        <nav
            className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between px-4 py-2 sticky top-0 z-50">
            <div className="flex items-center space-x-4">
                <img src="https://placehold.co/32x32/7c3aed/ffffff?text=L" alt="Logo" className="h-8 w-8 rounded-md"/>
                <div className="flex items-center space-x-1">
                    <NavTab name="compose" activeTab={activeTab} setActiveTab={setActiveTab}>
                        Compose
                    </NavTab>
                    <NavTab name="backup" activeTab={activeTab} setActiveTab={setActiveTab}>
                        Backup
                    </NavTab>
                </div>
            </div>
        </nav>
    );
};

const NavTab = ({name, activeTab, setActiveTab, children}) => {
    const isActive = name === activeTab;
    return (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
};
