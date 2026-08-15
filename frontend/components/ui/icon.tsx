import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { cn } from "@/lib/utils";

export function AppIcon({ className, ...props }: FontAwesomeIconProps) {
  return <FontAwesomeIcon className={cn("app-icon", className)} aria-hidden={props.title ? undefined : true} {...props} />;
}
