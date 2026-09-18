"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
export const giftScents = ["Desert Tonka", "Arctic Wave", "Zyrox", "RANK", "Silent Gold"] as const;
const Context = createContext<{
  company: string; setCompany: (value: string) => void;
  giftMessage: string; setGiftMessage: (value: string) => void;
  fragrances: string[]; setFragrances: (value: string[]) => void;
  applied: boolean; setApplied: (value: boolean) => void;
} | null>(null);
export function GiftPersonalisationProvider({ children }: { children: ReactNode }) {
  const [company,setCompany]=useState("");
  const [giftMessage,setGiftMessage]=useState("For the people who make a difference.");
  const [fragrances,setFragrances]=useState<string[]>(["Desert Tonka","Arctic Wave","Silent Gold"]);
  const [applied,setApplied]=useState(false);
  return <Context.Provider value={{company,setCompany,giftMessage,setGiftMessage,fragrances,setFragrances,applied,setApplied}}>{children}</Context.Provider>;
}
export function useGiftPersonalisation(){const value=useContext(Context);if(!value)throw new Error("Gift personalisation requires its provider");return value;}
