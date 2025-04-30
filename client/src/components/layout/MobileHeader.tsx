interface MobileHeaderProps {
  toggleMobileMenu: () => void;
}

const MobileHeader = ({ toggleMobileMenu }: MobileHeaderProps) => {
  return (
    <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white w-full">
      <h1 className="text-xl font-semibold text-primary">NutriTrack</h1>
      <button 
        type="button" 
        className="p-1 text-gray-400 focus:outline-none"
        onClick={toggleMobileMenu}
      >
        <span className="material-icons">menu</span>
      </button>
    </div>
  );
};

export default MobileHeader;
