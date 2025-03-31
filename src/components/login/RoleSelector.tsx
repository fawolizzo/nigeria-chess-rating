
import { UserCheck, Shield } from "lucide-react";

type RoleSelectorProps = {
  selectedRole: "tournament_organizer" | "rating_officer";
  onRoleChange: (role: "tournament_organizer" | "rating_officer") => void;
};

const RoleSelector = ({ selectedRole, onRoleChange }: RoleSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-2">
      <div
        className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
          selectedRole === "tournament_organizer"
            ? "border-nigeria-green bg-nigeria-green/5"
            : "border-gray-200 dark:border-gray-700"
        }`}
        onClick={() => onRoleChange("tournament_organizer")}
      >
        <UserCheck className={`h-6 w-6 mb-2 ${
          selectedRole === "tournament_organizer"
            ? "text-nigeria-green dark:text-nigeria-green-light"
            : "text-gray-500 dark:text-gray-400"
        }`} />
        <h3 className={`text-sm font-medium ${
          selectedRole === "tournament_organizer"
            ? "text-nigeria-green-dark dark:text-nigeria-green-light"
            : "text-gray-500 dark:text-gray-400"
        }`}>
          Tournament Organizer
        </h3>
      </div>
      
      <div
        className={`cursor-pointer rounded-md border p-4 flex flex-col items-center justify-center text-center ${
          selectedRole === "rating_officer"
            ? "border-nigeria-green bg-nigeria-green/5"
            : "border-gray-200 dark:border-gray-700"
        }`}
        onClick={() => onRoleChange("rating_officer")}
      >
        <Shield className={`h-6 w-6 mb-2 ${
          selectedRole === "rating_officer"
            ? "text-nigeria-green dark:text-nigeria-green-light"
            : "text-gray-500 dark:text-gray-400"
        }`} />
        <h3 className={`text-sm font-medium ${
          selectedRole === "rating_officer"
            ? "text-nigeria-green-dark dark:text-nigeria-green-light"
            : "text-gray-500 dark:text-gray-400"
        }`}>
          Rating Officer
        </h3>
      </div>
    </div>
  );
};

export default RoleSelector;
