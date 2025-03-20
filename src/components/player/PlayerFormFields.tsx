
import React from "react";
import { Control, FormState } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StateSelector from "@/components/selectors/StateSelector";
import { Player } from "@/lib/mockData";

// Define both interfaces for flexibility - one for direct player object and one for react-hook-form
interface PlayerFormFieldsProps {
  control?: Control<any>;
  formState?: FormState<any>;
  player?: Player;
  onChange?: (field: keyof Player, value: any) => void;
}

const chessTitles = ["CM", "FM", "IM", "GM", "WCM", "WFM", "WIM", "WGM"];

const PlayerFormFields: React.FC<PlayerFormFieldsProps> = ({ control, player, onChange }) => {
  // If player and onChange are provided, we're in direct edit mode (not using react-hook-form)
  if (player && onChange) {
    return (
      <>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
          <Input 
            placeholder="Enter player's full name" 
            value={player.name || ""} 
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Title (Optional)</label>
            <Select 
              value={player.title || "none"} 
              onValueChange={(value) => onChange("title", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="none" value="none">None</SelectItem>
                {chessTitles.map(title => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Gender</label>
            <Select 
              value={player.gender} 
              onValueChange={(value) => onChange("gender", value as 'M' | 'F')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Classical Rating</label>
            <Input 
              type="number" 
              min={800} 
              value={player.rating} 
              onChange={(e) => onChange("rating", Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Games Played (Classical)</label>
            <Input 
              type="number" 
              min={0}
              placeholder="Number of games" 
              value={player.gamesPlayed || ""} 
              onChange={(e) => onChange("gamesPlayed", e.target.value ? Number(e.target.value) : 0)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Rapid Rating (Optional)</label>
            <Input 
              type="number" 
              min={800} 
              placeholder="Rapid rating" 
              value={player.rapidRating || ""} 
              onChange={(e) => onChange("rapidRating", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Games Played (Rapid)</label>
            <Input 
              type="number" 
              min={0}
              placeholder="Number of games" 
              value={player.rapidGamesPlayed || ""} 
              onChange={(e) => onChange("rapidGamesPlayed", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Blitz Rating (Optional)</label>
            <Input 
              type="number" 
              min={800} 
              placeholder="Blitz rating" 
              value={player.blitzRating || ""} 
              onChange={(e) => onChange("blitzRating", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Games Played (Blitz)</label>
            <Input 
              type="number" 
              min={0}
              placeholder="Number of games" 
              value={player.blitzGamesPlayed || ""} 
              onChange={(e) => onChange("blitzGamesPlayed", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Birth Year (Optional)</label>
            <Input 
              type="number" 
              placeholder="YYYY" 
              value={player.birthYear || ""} 
              onChange={(e) => onChange("birthYear", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">State (Optional)</label>
            <StateSelector
              value={player.state || ""}
              onValueChange={(value) => onChange("state", value)}
            />
          </div>
        </div>
      </>
    );
  }
  
  // If control is provided, we're using react-hook-form
  if (control) {
    return (
      <>
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter player's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (Optional)</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem key="none" value="none">None</SelectItem>
                    {chessTitles.map(title => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classical Rating</FormLabel>
                <FormControl>
                  <Input type="number" min={800} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="gamesPlayed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Games Played (Classical)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    placeholder="Number of games" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="rapidRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rapid Rating (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={800} 
                    placeholder="Rapid rating" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="rapidGamesPlayed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Games Played (Rapid)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    placeholder="Number of games" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="blitzRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blitz Rating (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={800} 
                    placeholder="Blitz rating" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="blitzGamesPlayed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Games Played (Blitz)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    placeholder="Number of games" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="birthYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birth Year (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="YYYY" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State (Optional)</FormLabel>
                <FormControl>
                  <StateSelector
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </>
    );
  }
  
  return null;
};

export default PlayerFormFields;
