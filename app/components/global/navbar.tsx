import { Icon } from "@iconify/react/dist/iconify.js";
import { Avatar, Badge, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle, Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";
import { useLocation } from "@remix-run/react";
import { isContactActive, isExploreActive, isHomeActive, isSponsorsActive } from "~/utils/location";

export default function NavBarComponent() {

    const location = useLocation();

    return (
        <Navbar
            classNames={{
                base: "z-50 lg:backdrop-blur-lg lg:backdrop-filter border-b-1 border-secondary-400 flex-col",
                item: [
                    "transition-all duration-300",
                    "text-background-600 hover:text-background-900 active:text-secondary-900",
                    "data-[active=true]:text-secondary-600 data-[active=true]:hover:text-secondary-900",
                    "bg-transparent hover:bg-background-100 hover:shadow-md active:bg-secondary-100 active:shadow-sm",
                    "data-[active=true]:bg-secondary-200",
                    "rounded-t-none hover:rounded-t-md active:rounded-t-lg",
                    "data-[active=true]:rounded-t-md",
                ],
                wrapper: "px-4 sm:px-6 bg-gradient-to-b  from-background via-background/20 to-background/0",
            }}
            height="60px"
        >
            <NavbarBrand>
                <NavbarMenuToggle
                 className="mr-2 h-6 sm:hidden text-default"
                 />
                <Link href="/" className="flex items-center gap-2">
                    <p className="font-sans text-3xl text-inherit font-extralight tracking-wider">POAP.in</p>
                </Link>
            </NavbarBrand>
            <NavbarContent
                className="mt-4 ml-4 pt-2 pb-[0.5px] bg-background-50/20 hidden h-12 w-full max-w-fit gap-4 font-bold rounded-t-full px-12 border-[0.5px] border-secondary-200 border-b-0 sm:flex"
                justify="start"
            >
                <NavbarItem
                    className="h-full px-4" isActive={isHomeActive(location.pathname)}>
                    <Link className="flex gap-2 items-centerr h-full text-inherit" href="/">
                        Home
                    </Link>
                </NavbarItem>
                <NavbarItem className="h-full px-4" isActive={isExploreActive(location.pathname)}>
                    <Link aria-current="page" className="flex gap-2 items-centerr h-full text-inherit" href="/v">
                        Explore
                    </Link>
                </NavbarItem>
                <NavbarItem className="h-full px-4" isActive={isSponsorsActive(location.pathname)}>
                    <Link className="flex gap-2 items-centerr h-full text-inherit" href="/sponsors">
                        Sponsors
                    </Link>
                </NavbarItem>
                <NavbarItem className="h-full px-4" isActive={isContactActive(location.pathname)}>
                    <Link className="flex gap-2 items-centerr h-full text-inherit" href="/contact">
                        Contact
                    </Link>
                </NavbarItem>
            </NavbarContent>

            {/* Mobile Menu */}
            <NavbarMenu className="text-default gap-0 rounded-md">
                <NavbarMenuItem isActive={isHomeActive(location.pathname)}>
                    <Link className="w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-md rounded-b-none border-1 border-secondary-300 border-b-0" href="/">
                        Home
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isExploreActive(location.pathname)}>
                    <Link className="w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" href="/v">
                        Explore
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isSponsorsActive(location.pathname)}>
                    <Link className="w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-none border-1 border-secondary-300 border-b-0" href="/sponsors">
                        Sponsors
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem isActive={isContactActive(location.pathname)}>
                    <Link className="w-full hover:bg-background-300 h-full px-2 py-4 rounded-t-none rounded-b-md border-1 border-secondary-300" href="/contact">
                        Contact
                    </Link>
                </NavbarMenuItem>
            </NavbarMenu>
        </Navbar>
    );
}
