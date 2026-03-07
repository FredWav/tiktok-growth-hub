import { createContext, useContext, useState, ReactNode } from "react";

export type DiagnosticData = {
  firstName: string;
  tiktokUrl: string;
  audience: string;
  objectif: string;
  budget: string;
  temps: string;
  email: string;
  blocage: string;
};

const defaultData: DiagnosticData = {
  firstName: "",
  tiktokUrl: "",
  audience: "",
  objectif: "",
  budget: "",
  temps: "",
  blocage: "",
};

type DiagnosticContextType = {
  data: DiagnosticData;
  setData: React.Dispatch<React.SetStateAction<DiagnosticData>>;
  updateField: <K extends keyof DiagnosticData>(key: K, value: DiagnosticData[K]) => void;
  reset: () => void;
  isComplete: boolean;
};

const DiagnosticContext = createContext<DiagnosticContextType | null>(null);

export const DiagnosticProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<DiagnosticData>(defaultData);

  const updateField = <K extends keyof DiagnosticData>(key: K, value: DiagnosticData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setData(defaultData);

  const isComplete = !!(data.firstName && data.tiktokUrl && data.audience && data.objectif && data.budget && data.temps && data.blocage);

  return (
    <DiagnosticContext.Provider value={{ data, setData, updateField, reset, isComplete }}>
      {children}
    </DiagnosticContext.Provider>
  );
};

export const useDiagnostic = () => {
  const ctx = useContext(DiagnosticContext);
  if (!ctx) throw new Error("useDiagnostic must be used within DiagnosticProvider");
  return ctx;
};
