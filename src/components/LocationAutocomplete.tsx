import { useState, useEffect, useRef } from 'react'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  placeholder?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<{ id: string; text: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocompleteService = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize autocomplete service when Google Maps is loaded
  useEffect(() => {
    if (window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService()
    }
  }, [])

  const handleSearch = async (input: string) => {
    onChange(input)

    if (!input) {
      setSuggestions([])
      return
    }

    if (!autocompleteService.current) {
      return
    }

    setIsLoading(true)
    try {
      const result = await new Promise((resolve, reject) => {
        autocompleteService.current.getPlacePredictions(
          {
            input,
            types: ['(cities)']
          },
          (predictions: any[] | null, status: string) => {
            if (status === 'OK') {
              resolve(predictions)
            } else {
              reject(status)
            }
          }
        )
      })

      const formattedSuggestions = (result as any[]).map((prediction) => ({
        id: prediction.place_id,
        text: prediction.description
      }))
      setSuggestions(formattedSuggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => {
          setShowSuggestions(true)
          if (value) handleSearch(value)
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={placeholder}
      />
      {isLoading && (
        <p className="mt-1 text-sm text-gray-500">Loading suggestions...</p>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-black hover:bg-indigo-600 hover:text-white"
              onMouseDown={(e) => {
                e.preventDefault()
                const selectedText = suggestion.text
                onChange(selectedText)
                if (onSelect) {
                  onSelect(selectedText)
                }
                setShowSuggestions(false)
                setTimeout(() => {
                  inputRef.current?.blur()
                }, 100)
              }}
            >
              {suggestion.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 