import { createContext, useContext, type ReactNode } from "react";

/**
 * When a BottomSheet opens over a FigSheet (case details, specialist chat,
 * payment, current trip), the under sheet recesses like
 * UISheetPresentationController: scale ~0.93, lift, larger top radius, and a
 * dim pass — timed with `iosSheetTransition` / `iosSheetFade`.
 */
const UnderlayRecessedContext = createContext(false);

export function SheetStackProvider({
  recessed,
  children,
}: {
  recessed: boolean;
  children: ReactNode;
}) {
  return (
    <UnderlayRecessedContext.Provider value={recessed}>
      {children}
    </UnderlayRecessedContext.Provider>
  );
}

/** True while an overlay sheet is open above the map-backed Fig sheet. */
export function useUnderlayRecessed() {
  return useContext(UnderlayRecessedContext);
}
