import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const sidebarItems = [
  { name: "Dashboard", icon: HomeIcon, path: "/" },
  { name: "Stats", icon: ChartBarIcon, path: "/stats" },
  { name: "Buildings", icon: BuildingOfficeIcon, path: "/buildings" },
  { name: "Locations", icon: MapPinIcon, path: "/locations" },
];

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const router = useRouter();

  return (
    <div className={`flex flex-col bg-gray-900 text-gray-200 ${isCollapsed ? "w-20" : "w-64"} h-screen fixed transition-all duration-300`}>
      <div className="flex items-center justify-between h-16 bg-gray-800 px-4">
        <h1 className={`${isCollapsed ? "hidden" : "block"} text-2xl font-semibold`}>My Dashboard</h1>
        <button onClick={toggleCollapse} className="text-gray-200 focus:outline-none">
          {isCollapsed ? <ChevronRightIcon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.name}
            onClick={() => router.push(item.path)}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700 hover:text-white"
          >
            <item.icon className="h-6 w-6 mr-3" />
            <span className={`${isCollapsed ? "hidden" : "block"}`}>{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="px-2 py-4">
        <button
          onClick={() => {
            router.push("/login");
          }}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
          <span className={`${isCollapsed ? "hidden" : "block"}`}>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
