
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
import StateSelector from "@/components/selectors/StateSelector"; // This is already a default import, as identified by the error.
// If CitySelector is used and has the same issue, it would be:
// import CitySelector from "@/components/selectors/CitySelector"; // Assuming CitySelector exists and is default export

interface PlayerFormFieldsProps {
  control: Control<any>;
  formState: FormState<any>;
}

const chessTitles = ["CM", "FM", "IM", "GM", "WCM", "WFM", "WIM", "WGM"];

const PlayerFormFields: React.FC<PlayerFormFieldsProps> = ({ control }) => {
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
};

export default PlayerFormFields;
