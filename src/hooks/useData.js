import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Helper: timeout wrapper untuk setiap query Supabase
// Jika query tidak selesai dalam `ms` milidetik, resolve dengan data kosong
function withTimeout(promise, ms = 8000) {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ data: null, error: { message: "Query timeout" } }), ms)
  );
  return Promise.race([promise, timeout]);
}

// ── useTransactions ────────────────────────────────────────────────────────────
export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const { data, error: err } = await withTimeout(
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
    );

    if (!isMounted.current) return;
    if (err) setError(err.message);
    else setTransactions(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = async (tx) => {
    const { data, error: err } = await withTimeout(
      supabase.from("transactions")
        .insert([{ ...tx, user_id: user.id }])
        .select().single()
    );
    if (!err && data && isMounted.current) setTransactions(prev => [data, ...prev]);
    return { data, error: err };
  };

  const remove = async (id) => {
    const { error: err } = await supabase
      .from("transactions").delete().eq("id", id).eq("user_id", user.id);
    if (!err && isMounted.current) setTransactions(prev => prev.filter(t => t.id !== id));
    return { error: err };
  };

  const update = async (id, updates) => {
    const { data, error: err } = await withTimeout(
      supabase.from("transactions").update(updates)
        .eq("id", id).eq("user_id", user.id).select().single()
    );
    if (!err && data && isMounted.current) setTransactions(prev => prev.map(t => t.id === id ? data : t));
    return { data, error: err };
  };

  return { transactions, setTransactions, loading, error, reload: load, add, remove, update };
}

// ── useGoals ───────────────────────────────────────────────────────────────────
export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals]   = useState([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    withTimeout(
      supabase.from("savings_goals").select("*").eq("user_id", user.id).order("created_at")
    ).then(({ data }) => {
      if (!isMounted.current) return;
      setGoals(data || []);
      setLoading(false);
    });
  }, [user]);

  const add = async (goal) => {
    const { data, error } = await withTimeout(
      supabase.from("savings_goals").insert([{ ...goal, user_id: user.id }]).select().single()
    );
    if (!error && data && isMounted.current) setGoals(prev => [...prev, data]);
    return { data, error };
  };

  const update = async (id, updates) => {
    const { data, error } = await withTimeout(
      supabase.from("savings_goals").update(updates).eq("id", id).eq("user_id", user.id).select().single()
    );
    if (!error && data && isMounted.current) setGoals(prev => prev.map(g => g.id === id ? data : g));
    return { data, error };
  };

  const remove = async (id) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", user.id);
    if (!error && isMounted.current) setGoals(prev => prev.filter(g => g.id !== id));
    return { error };
  };

  return { goals, loading, add, update, remove };
}

// ── useSubscriptions ───────────────────────────────────────────────────────────
export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]             = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    withTimeout(
      supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at")
    ).then(({ data }) => {
      if (!isMounted.current) return;
      setSubscriptions(data || []);
      setLoading(false);
    });
  }, [user]);

  const add = async (sub) => {
    const { data, error } = await withTimeout(
      supabase.from("subscriptions").insert([{ ...sub, user_id: user.id }]).select().single()
    );
    if (!error && data && isMounted.current) setSubscriptions(prev => [...prev, data]);
    return { data, error };
  };

  const remove = async (id) => {
    const { error } = await supabase.from("subscriptions").delete().eq("id", id).eq("user_id", user.id);
    if (!error && isMounted.current) setSubscriptions(prev => prev.filter(s => s.id !== id));
    return { error };
  };

  return { subscriptions, loading, add, remove };
}
