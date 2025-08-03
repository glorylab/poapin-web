import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle } from "@heroui/react";
import { Link, useLocation, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { isCardActive, isContactActive, isExplorerActive, isHomeActive, isSponsorsActive } from "~/utils/location";

export default function NavBarComponent() {

    const location = useLocation();
    const navigation = useNavigation();
    const [isNavigating, setIsNavigating] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (navigation.state === "loading") {
            setIsNavigating(true);
            setIsMenuOpen(false); // Close menu when navigation starts
        } else {
            const timer = setTimeout(() => setIsNavigating(false), 600);
            return () => clearTimeout(timer);
        }
    }, [navigation.state]);

    const handleMenuItemClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <Navbar
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
            classNames={{
                base: `z-[99999] lg:backdrop-blur-lg lg:backdrop-filter flex-col border-secondary-200 transition-all bg-gradient-to-b  ${isNavigating
                    ? 'navigating shadow-2xl border-b-2 bg-background-200/50 from-background via-background/20 to-background/0'
                    : 'shadow-md border-b-1 bg-background/50 from-background via-background/20 to-background/0'
                    }`,
                item: [
                    "transition-all duration-300",
                    "text-background-600 hover:text-background-900 active:text-secondary-900",
                    "data-[active=true]:text-secondary-600 data-[active=true]:hover:text-secondary-900",
                    "bg-transparent hover:bg-background-100 hover:shadow-md active:bg-secondary-100 active:shadow-sm",
                    "data-[active=true]:bg-secondary-200",
                    "rounded-t-none hover:rounded-t-md active:rounded-t-lg",
                    "data-[active=true]:rounded-t-md",
                ],
                wrapper: `px-4 md:px-6`,
            }}
            height="60px"
        >
            <NavbarBrand
            >
                <NavbarMenuToggle
                    className="mr-2 h-6 md:hidden text-default"
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                />
                <Link to="/" className="flex items-center gap-2" title="POAPin - POAP Collection Viewer">
                    <div className="relative">
                        <img 
                            src="/images/title_poapin_s.png" 
                            alt="POAP.in" 
                            className="h-8 w-auto object-contain opacity-90" 
                            style={{ maxHeight: '32px' }}
                        />
                        <span 
                            className="absolute top-0 left-0 w-0 h-0 overflow-hidden" 
                            aria-hidden="true"
                            role="presentation"
                        >
                            POAP.in
                        </span>
                    </div>
                </Link>
            </NavbarBrand>
            <NavbarContent
                className="mt-4 ml-4 pt-2 mb-1 pb-[0.5px] bg-background-50/20 hidden h-12 w-full max-w-fit gap-4 font-bold rounded-t-full px-12 border-[0.5px] border-secondary-200 border-b-0 md:flex"
                justify="start"
            >
                <NavbarItem
                    className="flex items-center h-full px-4" isActive={isHomeActive(location.pathname)}>
                    <Link to="/" className="flex items-center gap-2 h-full text-inherit" title="Home - POAPin">
                        Home
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isExplorerActive(location.pathname)}>
                    <Link to="/v" className="flex items-center gap-2 h-full text-inherit" title="Explorer - Browse POAP Collections">
                        Explorer
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isCardActive(location.pathname)}>
                    <Link to="/card" className="flex items-center gap-2 h-full text-inherit" title="Card - Create POAP Card">
                        Card
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isSponsorsActive(location.pathname)}>
                    <Link to="/sponsors" className="flex items-center gap-2 h-full text-inherit" title="Sponsors - Our Supporters">
                        Sponsors
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isContactActive(location.pathname)}>
                    <Link to="/contact" className="flex items-center gap-2 h-full text-inherit" title="Contact - Get in Touch">
                        Contact
                    </Link>
                </NavbarItem>
            </NavbarContent>

            {/* Mobile Menu */}
            <NavbarMenu className="text-default gap-0 rounded-md">
                <NavbarMenuItem isActive={isHomeActive(location.pathname)}>
                    <Link to="/" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-md rounded-b-none border border-secondary-300 border-b-0" onClick={handleMenuItemClick} title="Home - POAPin">
                        Home
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isExplorerActive(location.pathname)}>
                    <Link to="/v" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" onClick={handleMenuItemClick} title="Explorer - Browse POAP Collections">
                        Explorer
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isCardActive(location.pathname)}>
                    <Link to="/card" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" onClick={handleMenuItemClick} title="Card - Create POAP Card">
                        Card
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isSponsorsActive(location.pathname)}>
                    <Link to="/sponsors" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" onClick={handleMenuItemClick} title="Sponsors - Our Supporters">
                        Sponsors
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isContactActive(location.pathname)}>
                    <Link to="/contact" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-md border-1 border-secondary-300" onClick={handleMenuItemClick} title="Contact - Get in Touch">
                        Contact
                    </Link>
                </NavbarMenuItem>
            </NavbarMenu>
        </Navbar>
    );
}
