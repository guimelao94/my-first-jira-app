import { useState } from 'react'

const useGlobal = () => {
    const [epics,setEpics] = useState({ Epic: "DMA-2" });
  return {epics,setEpics}
}

export default useGlobal;
