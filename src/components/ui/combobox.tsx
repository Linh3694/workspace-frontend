"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, X } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { Badge } from "./badge"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  selectedValues?: string[]
  onSelect?: (value: string) => void
  onChange?: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  multiple?: boolean
}

export function Combobox({
  options,
  value,
  selectedValues = [],
  onSelect,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  multiple = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value || "")

  // Sync internal value với prop value khi nó thay đổi
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  const currentValues = multiple ? selectedValues : [internalValue]

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter((v) => v !== selectedValue)
        : [...currentValues, selectedValue]
      onChange?.(newValues)
    } else {
      const newValue = selectedValue === internalValue ? "" : selectedValue
      setInternalValue(newValue)
      onSelect?.(newValue)
      setOpen(false)
    }
  }

  const removeValue = (valueToRemove: string) => {
    if (multiple) {
      const newValues = currentValues.filter((v) => v !== valueToRemove)
      onChange?.(newValues)
    }
  }

  const getDisplayText = () => {
    if (multiple) {
      if (currentValues.length === 0) return placeholder
      if (currentValues.length === 1) {
        const option = options.find((opt) => opt.value === currentValues[0])
        return option?.label || placeholder
      }
      return `${currentValues.length} selected`
    } else {
      const option = options.find((opt) => opt.value === internalValue)
      return option?.label || placeholder
    }
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentValues.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {multiple && currentValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {currentValues.map((val) => {
            const option = options.find((opt) => opt.value === val)
            return (
              <Badge key={val} variant="secondary" className="text-xs">
                {option?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => removeValue(val)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}