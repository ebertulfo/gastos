"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

const currencyCodes = [
  { label: "US Dollar", value: "USD" },
  { label: "Euro", value: "EUR" },
  { label: "Japanese Yen", value: "JPY" },
  { label: "British Pound", value: "GBP" },
  { label: "Australian Dollar", value: "AUD" },
  { label: "Canadian Dollar", value: "CAD" },
  { label: "Swiss Franc", value: "CHF" },
  { label: "Chinese Yuan", value: "CNY" },
  { label: "Swedish Krona", value: "SEK" },
  { label: "New Zealand Dollar", value: "NZD" },
  { label: "Mexican Peso", value: "MXN" },
  { label: "Singapore Dollar", value: "SGD" },
  { label: "Hong Kong Dollar", value: "HKD" },
  { label: "Norwegian Krone", value: "NOK" },
  { label: "South Korean Won", value: "KRW" },
  { label: "Turkish Lira", value: "TRY" },
  { label: "Russian Ruble", value: "RUB" },
  { label: "Indian Rupee", value: "INR" },
  { label: "Brazilian Real", value: "BRL" },
  { label: "South African Rand", value: "ZAR" },
  { label: "Philippine Peso", value: "PHP" },
  { label: "Czech Koruna", value: "CZK" },
  { label: "Indonesian Rupiah", value: "IDR" },
  { label: "Malaysian Ringgit", value: "MYR" },
  { label: "Hungarian Forint", value: "HUF" },
  { label: "Icelandic Krona", value: "ISK" },
  { label: "Croatian Kuna", value: "HRK" },
  { label: "Bulgarian Lev", value: "BGN" },
  { label: "Romanian Leu", value: "RON" },
  { label: "Danish Krone", value: "DKK" },
  { label: "Thai Baht", value: "THB" },
  { label: "Polish Zloty", value: "PLN" },
  { label: "Argentine Peso", value: "ARS" },
  { label: "Chilean Peso", value: "CLP" },
  { label: "Colombian Peso", value: "COP" },
  { label: "Peruvian Sol", value: "PEN" },
  { label: "Uruguayan Peso", value: "UYU" },
  { label: "Venezuelan Bolivar", value: "VES" },
  { label: "Egyptian Pound", value: "EGP" },
  { label: "Israeli Shekel", value: "ILS" },
  { label: "Saudi Riyal", value: "SAR" },
  { label: "United Arab Emirates Dirham", value: "AED" },
  { label: "Qatari Riyal", value: "QAR" },
  { label: "Kuwaiti Dinar", value: "KWD" },
  { label: "Bahraini Dinar", value: "BHD" },
  { label: "Omani Rial", value: "OMR" },
  { label: "Jordanian Dinar", value: "JOD" },
  { label: "Lebanese Pound", value: "LBP" },
  { label: "Pakistani Rupee", value: "PKR" },
  { label: "Bangladeshi Taka", value: "BDT" },
  { label: "Sri Lankan Rupee", value: "LKR" },
  { label: "Nepalese Rupee", value: "NPR" },
  { label: "Afghan Afghani", value: "AFN" },
  { label: "Iranian Rial", value: "IRR" },
  { label: "Iraqi Dinar", value: "IQD" },
  { label: "Syrian Pound", value: "SYP" },
  { label: "Yemeni Rial", value: "YER" },
  { label: "Armenian Dram", value: "AMD" },
  { label: "Azerbaijani Manat", value: "AZN" },
  { label: "Georgian Lari", value: "GEL" },
  { label: "Kazakhstani Tenge", value: "KZT" },
  { label: "Kyrgyzstani Som", value: "KGS" },
  { label: "Tajikistani Somoni", value: "TJS" },
  { label: "Turkmenistani Manat", value: "TMT" },
  { label: "Uzbekistani Som", value: "UZS" },
  { label: "Vietnamese Dong", value: "VND" },
  { label: "Cambodian Riel", value: "KHR" },
  { label: "Laotian Kip", value: "LAK" },
  { label: "Myanmar Kyat", value: "MMK" },
  { label: "Brunei Dollar", value: "BND" },
  { label: "Maldivian Rufiyaa", value: "MVR" },
  { label: "Mongolian Tugrik", value: "MNT" },
  { label: "North Korean Won", value: "KPW" },
  { label: "Macanese Pataca", value: "MOP" },
  { label: "Papua New Guinean Kina", value: "PGK" },
  { label: "Fijian Dollar", value: "FJD" },
  { label: "Tongan Paʻanga", value: "TOP" },
  { label: "Samoan Tala", value: "WST" },
  { label: "Solomon Islands Dollar", value: "SBD" },
  { label: "Vanuatu Vatu", value: "VUV" },
  { label: "New Caledonian Franc", value: "XPF" },
  { label: "Central African CFA Franc", value: "XAF" },
  { label: "West African CFA Franc", value: "XOF" },
  { label: "Congolese Franc", value: "CDF" },
  { label: "Djiboutian Franc", value: "DJF" },
  { label: "Eritrean Nakfa", value: "ERN" },
  { label: "Ethiopian Birr", value: "ETB" },
  { label: "Gambian Dalasi", value: "GMD" },
  { label: "Ghanaian Cedi", value: "GHS" },
  { label: "Guinean Franc", value: "GNF" },
  { label: "Kenyan Shilling", value: "KES" },
  { label: "Lesotho Loti", value: "LSL" },
  { label: "Liberian Dollar", value: "LRD" },
  { label: "Malawian Kwacha", value: "MWK" },
  { label: "Mauritanian Ouguiya", value: "MRU" },
  { label: "Mauritian Rupee", value: "MUR" },
  { label: "Mozambican Metical", value: "MZN" },
  { label: "Namibian Dollar", value: "NAD" },
  { label: "Nigerian Naira", value: "NGN" },
  { label: "Rwandan Franc", value: "RWF" },
  { label: "Sao Tome and Principe Dobra", value: "STN" },
  { label: "Seychellois Rupee", value: "SCR" },
  { label: "Sierra Leonean Leone", value: "SLL" },
  { label: "Somali Shilling", value: "SOS" },
  { label: "South Sudanese Pound", value: "SSP" },
  { label: "Sudanese Pound", value: "SDG" },
  { label: "Tanzanian Shilling", value: "TZS" },
  { label: "Ugandan Shilling", value: "UGX" },
  { label: "Zambian Kwacha", value: "ZMW" },
  { label: "Zimbabwean Dollar", value: "ZWL" },
  { label: "Belarusian Ruble", value: "BYN" },
  { label: "Botswana Pula", value: "BWP" },
  { label: "Cape Verdean Escudo", value: "CVE" },
  { label: "Cuban Peso", value: "CUP" },
  { label: "Dominican Peso", value: "DOP" },
  { label: "Falkland Islands Pound", value: "FKP" },
  { label: "Gibraltar Pound", value: "GIP" },
  { label: "Guatemalan Quetzal", value: "GTQ" },
  { label: "Honduran Lempira", value: "HNL" },
  { label: "Jamaican Dollar", value: "JMD" },
  { label: "Malagasy Ariary", value: "MGA" },
  { label: "Moldovan Leu", value: "MDL" },
  { label: "Moroccan Dirham", value: "MAD" },
  { label: "Nicaraguan Cordoba", value: "NIO" },
  { label: "Panamanian Balboa", value: "PAB" },
  { label: "Paraguayan Guarani", value: "PYG" },
  { label: "Trinidad and Tobago Dollar", value: "TTD" },
  { label: "Tunisian Dinar", value: "TND" },
  { label: "Ukrainian Hryvnia", value: "UAH" },
  { label: "Aruban Florin", value: "AWG" },
  { label: "Bahamian Dollar", value: "BSD" },
  { label: "Barbadian Dollar", value: "BBD" },
  { label: "Bhutanese Ngultrum", value: "BTN" },
  { label: "Bolivian Boliviano", value: "BOB" },
  { label: "Burundian Franc", value: "BIF" },
  { label: "Comorian Franc", value: "KMF" },
  { label: "East Caribbean Dollar", value: "XCD" },
  { label: "Guyanese Dollar", value: "GYD" },
  { label: "Haitian Gourde", value: "HTG" },
  { label: "Libyan Dinar", value: "LYD" },
  { label: "Surinamese Dollar", value: "SRD" },
];

interface CurrencyCodeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CurrencyCodeCombobox({
  className,
  value,
  onChange,
}: CurrencyCodeComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Filter currencies based on query
  const filteredCurrencies = query
    ? currencyCodes.filter((currency) =>
        currency.label.toLowerCase().includes(query.toLowerCase())
      )
    : currencyCodes;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? `${value}` : "Select currency..."}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search currency..."
            className="h-9"
            value={query}
            onValueChange={(e) => setQuery(e)} // Update query on input change
          />
          <CommandList>
            {filteredCurrencies.length === 0 ? (
              <CommandEmpty>No currency found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCurrencies.map((currency) => (
                  <CommandItem
                    key={currency.value}
                    onSelect={(currentValue) => {
                      console.log(currentValue);
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setQuery(""); // Reset query on select
                    }}
                  >
                    <span>{currency.label}</span>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === currency.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
