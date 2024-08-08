import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle } from "@nextui-org/react";
import { Link, useLocation, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { isContactActive, isExplorerActive, isHomeActive, isOGActive, isSponsorsActive } from "~/utils/location";

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
                base: `z-50 lg:backdrop-blur-lg lg:backdrop-filter flex-col border-secondary-200 transition-all bg-gradient-to-b  ${isNavigating
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
                <Link to="/" className="flex items-center gap-2">
                    <p className="font-sans text-3xl text-inherit font-extralight tracking-wider text-white">POAP.in</p>
                </Link>
            </NavbarBrand>
            <NavbarContent
                className="mt-4 ml-4 pt-2 mb-1 pb-[0.5px] bg-background-50/20 hidden h-12 w-full max-w-fit gap-4 font-bold rounded-t-full px-12 border-[0.5px] border-secondary-200 border-b-0 md:flex"
                justify="start"
            >
                <NavbarItem
                    className="flex items-center h-full px-4" isActive={isHomeActive(location.pathname)}>
                    <Link to="/" className="flex items-center gap-2 h-full text-inherit" >
                        Home
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isExplorerActive(location.pathname)}>
                    <Link to="/v" className="flex items-center gap-2 h-full text-inherit" >
                        Explorer
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isOGActive(location.pathname)}>
                    <Link to="/og" className="flex items-center gap-2 h-full text-inherit" >
                        OG
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isSponsorsActive(location.pathname)}>
                    <Link to="/sponsors" className="flex items-center gap-2 h-full text-inherit">
                        Sponsors
                    </Link>
                </NavbarItem>
                <NavbarItem className="flex items-center h-full px-4" isActive={isContactActive(location.pathname)}>
                    <Link to="/contact" className="flex items-center gap-2 h-full text-inherit" >
                        Contact
                    </Link>
                </NavbarItem>
            </NavbarContent>

            {/* Mobile Menu */}
            <NavbarMenu className="text-default gap-0 rounded-md">
                <NavbarMenuItem isActive={isHomeActive(location.pathname)}>
                    <Link to="/" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-md rounded-b-none border border-secondary-300 border-b-0" onClick={handleMenuItemClick}>
                        Home
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isExplorerActive(location.pathname)}>
                    <Link to="/v" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" onClick={handleMenuItemClick}>
                        Explorer
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isOGActive(location.pathname)}>
                    <Link to="/og" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" onClick={handleMenuItemClick}>
                        OG
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isSponsorsActive(location.pathname)}>
                    <Link to="/sponsors" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" onClick={handleMenuItemClick}>
                        Sponsors
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isContactActive(location.pathname)}>
                    <Link to="/contact" className="block w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-md border-1 border-secondary-300" onClick={handleMenuItemClick}>
                        Contact
                    </Link>
                </NavbarMenuItem>
            </NavbarMenu>
        </Navbar>
    );
}
