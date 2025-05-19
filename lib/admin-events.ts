import { create } from "zustand"

// Define event types
export type AdminEvent = {
  id: string
  type: "product_created" | "report_created" | "withdrawal_created" | "order_created" | "user_registered"
  data: any
  timestamp: string
}

// Create a store to manage events
interface AdminEventsState {
  events: AdminEvent[]
  pendingProductCount: number
  pendingReportCount: number
  pendingWithdrawalCount: number
  lastRefreshed: string | null
  addEvent: (event: AdminEvent) => void
  markAllSeen: () => void
  incrementPendingProduct: () => void
  decrementPendingProduct: () => void
  incrementPendingReport: () => void
  decrementPendingReport: () => void
  incrementPendingWithdrawal: () => void
  decrementPendingWithdrawal: () => void
  resetCounts: (counts: {
    pendingProductCount: number
    pendingReportCount: number
    pendingWithdrawalCount: number
  }) => void
}

export const useAdminEvents = create<AdminEventsState>((set) => ({
  events: [],
  pendingProductCount: 0,
  pendingReportCount: 0,
  pendingWithdrawalCount: 0,
  lastRefreshed: null,
  addEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 50) })),
  markAllSeen: () => set({ lastRefreshed: new Date().toISOString() }),
  incrementPendingProduct: () => set((state) => ({ pendingProductCount: state.pendingProductCount + 1 })),
  decrementPendingProduct: () => set((state) => ({ pendingProductCount: Math.max(0, state.pendingProductCount - 1) })),
  incrementPendingReport: () => set((state) => ({ pendingReportCount: state.pendingReportCount + 1 })),
  decrementPendingReport: () => set((state) => ({ pendingReportCount: Math.max(0, state.pendingReportCount - 1) })),
  incrementPendingWithdrawal: () => set((state) => ({ pendingWithdrawalCount: state.pendingWithdrawalCount + 1 })),
  decrementPendingWithdrawal: () =>
    set((state) => ({ pendingWithdrawalCount: Math.max(0, state.pendingWithdrawalCount - 1) })),
  resetCounts: (counts) => set(counts),
}))

// Function to start listening for admin events
export function startAdminEventListener(adminApiSecret: string) {
  if (typeof window === "undefined") return () => {}

  console.log("Starting admin event listener...")

  const eventSource = new EventSource(`/api/admin/events`, {
    withCredentials: true,
  })

  // Add authorization header using fetch API
  fetch("/api/admin/events", {
    headers: {
      Authorization: `Bearer ${adminApiSecret}`,
    },
  })
    .then(() => {
      console.log("Admin events authorization sent")
    })
    .catch((err) => {
      console.error("Error sending admin events authorization:", err)
    })

  const store = useAdminEvents.getState()

  eventSource.onopen = () => {
    console.log("Admin events connection opened")
  }

  eventSource.onmessage = (event) => {
    try {
      console.log("Admin event received:", event.data)
      const data = JSON.parse(event.data)

      if (data.type === "ping") {
        console.log("Admin events ping received")
        return
      }

      if (data.type === "connected") {
        console.log("Admin events connected with ID:", data.id)
        return
      }

      if (data.type === "product_created") {
        console.log("New product created event received")
        store.addEvent(data)
        store.incrementPendingProduct()
      } else if (data.type === "report_created") {
        store.addEvent(data)
        store.incrementPendingReport()
      } else if (data.type === "withdrawal_created") {
        store.addEvent(data)
        store.incrementPendingWithdrawal()
      } else {
        store.addEvent(data)
      }
    } catch (error) {
      console.error("Error processing admin event:", error)
    }
  }

  eventSource.onerror = (error) => {
    console.error("Admin events stream error:", error)
    eventSource.close()

    // Try to reconnect after 5 seconds
    setTimeout(() => startAdminEventListener(adminApiSecret), 5000)
  }

  // Return cleanup function
  return () => {
    console.log("Closing admin event listener")
    eventSource.close()
  }
}
