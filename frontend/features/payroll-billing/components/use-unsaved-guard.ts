"use client";
import {useEffect} from "react";
export function useUnsavedGuard(dirty:boolean){useEffect(()=>{if(!dirty)return;const handler=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",handler);return()=>window.removeEventListener("beforeunload",handler);},[dirty]);return(action:()=>void)=>{if(!dirty||window.confirm("Perubahan belum disimpan. Tutup tanpa menyimpan?"))action();};}
