import { useEffect, useRef } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { getSocket, joinHospitalRoom, leaveHospitalRoom } from '../socket/socket';
import { inventoryApi } from '../api/inventory';

/**
 * Connects to the backend Socket.IO server, joins the public hospital room,
 * and wires up real-time `inventory_updated` events to the inventory store.
 * Also performs an initial REST fetch on mount.
 */
export function useInventorySocket(hospitalId: string) {  // UUID
  const { token } = useAuthStore();
  const { setInventory, applySocketUpdate, setIsLive, setIsLoading, clear } =
    useInventoryStore();
  const mountedRef = useRef(true);

  // Initial load via REST
  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    inventoryApi
      .getByHospital(hospitalId)
      .then((res) => {
        if (mountedRef.current) setInventory(res.inventory, res.last_updated);
      })
      .catch(() => setIsLoading(false));

    return () => {
      mountedRef.current = false;
      clear();
    };
  }, [hospitalId]);

  // Real-time socket
  useEffect(() => {
    const socket = getSocket(token ?? undefined);

    const handleConnect = () => {
      setIsLive(true);
      joinHospitalRoom(hospitalId);
    };

    const handleDisconnect = () => {
      setIsLive(false);
    };

    const handleInventoryUpdate = (data: unknown) => {
      applySocketUpdate(data);
      // Re-fetch full inventory to stay consistent
      inventoryApi
        .getByHospital(hospitalId)
        .then((res) => {
          if (mountedRef.current) setInventory(res.inventory, res.last_updated);
        })
        .catch(() => {});
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('inventory_updated', handleInventoryUpdate);
    socket.on('dashboard_updated', handleInventoryUpdate);

    return () => {
      leaveHospitalRoom(hospitalId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('inventory_updated', handleInventoryUpdate);
      socket.off('dashboard_updated', handleInventoryUpdate);
    };
  }, [hospitalId, token]);
}
