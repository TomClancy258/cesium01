import { onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import {
  PhotogrammetryFilterForm,
  PhotogrammetryHoveredProperties,
  PhotogrammetryTypeFilterValue,
} from '@/views/aviation-situation/types/photogrammetry'
import { clearSelectedAviation } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
import { usePhotogrammetryStore } from '@/stores/photogrammetry'

export function usePhotogrammetry(viewer) {
  const photogrammetryStore = usePhotogrammetryStore()
  const photogrammetryMap = new Map<string, Cesium.Cesium3DTileset>()
  const {
    tooltip,
    showTooltip: showPhotogrammetryTooltip,
    hideTooltip: hidePhotogrammetryTooltip,
  } = useAviationTooltip<PhotogrammetryHoveredProperties>({
    sourceType: 'photogrammetry',
    lngLatAlt: {
      longitude: 0,
      latitude: 0,
      height: 0,
    },
  })

  let activePhotogrammetry={
    id:'',
    tileset:null
  }

  const initPhotogrammetrys = () => {
    // addPhotogrammetrys()
    setPhotogrammetryTable()
    subscribePhotogrammetryEvents()
    setupPhotogrammetryFilterFormWatch()
  }

  const addPhotogrammetryTileset = async (
    assetId: number,
    name: string,
    zoomTo = false,
  ) => {
    activePhotogrammetry.tileset = viewer.value.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(assetId),
    )
    activePhotogrammetry.id=assetId
    activePhotogrammetry.tileset.meta = {
      sourceType: 'photogrammetry',
      name,
    }
    viewer.value.zoomTo(activePhotogrammetry.tileset)
    // photogrammetryMap.set(name, photogrammetryTileset)
  }

  const setPhotogrammetryTable=()=>{
    const photogrammetrys=[
      {
        id:354759,
        name:'Boston'
      },
      {
        id:1415196,
        name:'SanFrancisco'
      },
      {
        id:69380,
        name:'Melbourne'
      },
      {
        id:57588,
        name:'WashingtonDC'
      },
      {
        id:57590,
        name:'WashingtonState'
      },
    ]
    photogrammetrys.forEach((item,i)=>{
      photogrammetryStore.setMatchedPhotogrammetry(item)
    })
    photogrammetryStore.commitMatchedPhotogrammetrys()
  }

  const addPhotogrammetrys = () => {
    addBostonPhotogrammetry()
    addSanFranciscoPhotogrammetry()
    addMelbournePhotogrammetry()
    addWashingtonDCPhotogrammetry()
    addWashingtonStatePhotogrammetry()
  }

  const addBostonPhotogrammetry = () => addPhotogrammetryTileset(354759, 'Boston')
  const addSanFranciscoPhotogrammetry = () => addPhotogrammetryTileset(1415196, 'SanFrancisco')
  const addMelbournePhotogrammetry = () => addPhotogrammetryTileset(69380, 'Melbourne')
  const addWashingtonDCPhotogrammetry = () => addPhotogrammetryTileset(57588, 'WashingtonDC')
  const addWashingtonStatePhotogrammetry = () => addPhotogrammetryTileset(57590, 'WashingtonState')

  const addPhotogrammetryById=(id:number)=>{
    if (activePhotogrammetry.id === id) {
      viewer.value.zoomTo(activePhotogrammetry.tileset)
      return
    }
    viewer.value.scene.primitives.remove(activePhotogrammetry.tileset)
    activePhotogrammetry.tileset=null
    if (id === 354759) {
      addBostonPhotogrammetry()
    } else if (id === 1415196) {
      addSanFranciscoPhotogrammetry()
    } else if (id === 69380) {
      addMelbournePhotogrammetry()
    } else if (id === 57588) {
      addWashingtonDCPhotogrammetry()
    } else if (id === 57590) {
      addWashingtonStatePhotogrammetry()
    }
    activePhotogrammetry.id=id
  }

  let unsubPhotogrammetryHover: () => void
  let unsubPhotogrammetryLeave: () => void

  const subscribePhotogrammetryEvents = () => {
    unsubPhotogrammetryHover = onCesiumEvent(
      'photogrammetryHover',
      (properties: PhotogrammetryHoveredProperties, screenPosition: Cesium.Cartesian2) => {
        showPhotogrammetryTooltip(screenPosition, properties)
      },
    )

    unsubPhotogrammetryLeave = onCesiumEvent('photogrammetryLeave', () => {
      hidePhotogrammetryTooltip()
    })
  }

  const removeActivePhotogrammetry=()=>{
    if (activePhotogrammetry.id !== '') {
      viewer.value.scene.primitives.remove(activePhotogrammetry.tileset)
      activePhotogrammetry={
        id:'',
        tileset: null
      }
    }
  }

  const filterPhotogrammetrys = (
    newPhotogrammetryFilterForm: PhotogrammetryFilterForm,
    oldPhotogrammetryFilterForm?: PhotogrammetryFilterForm,
  ) => {
    if (
      oldPhotogrammetryFilterForm &&
      newPhotogrammetryFilterForm.colorByType !== oldPhotogrammetryFilterForm.colorByType
    ) {
      clearSelectedAviation()
    }
    const types: PhotogrammetryTypeFilterValue[] = newPhotogrammetryFilterForm.types
    const colorByType: boolean = newPhotogrammetryFilterForm.colorByType
    let showStr = ''
    types.forEach((item, i) => {
      if (item !== 'others') {
        showStr += "${building} === '" + item + "'"
      } else {
        showStr +=
          "(${building} !== 'retail' && " +
          "${building} !== 'commercial' && " +
          "${building} !== 'yes' && " +
          "${building} !== 'industrial' && " +
          "${building} !== 'apartments' && " +
          "${building} !== 'residential' && " +
          "${building} !== 'office' && " +
          "${building} !== 'parking' && " +
          "${building} !== 'others')"
      }
      if (i !== types.length - 1) {
        showStr += ' || '
      }
    })
    if (types.length === 0) {
      showStr = 'false'
    }
    let conditions = []
    if (colorByType) {
      conditions = [
        ["${building} === 'retail'", "color('#f4ea2a')"],
        ["${building} === 'commercial'", "color('skyblue', 0.5)"],
        ["${building} === 'yes'", "color('grey')"],
        ["${building} === 'industrial'", "color('indianred')"],
        ["${building} === 'apartments'", "color('lightslategrey')"],
        ["${building} === 'residential'", "color('lightgrey')"],
        ["${building} === 'office'", "color('lightsteelblue')"],
        ["${building} === 'parking'", "color('#b124ca')"],
        ['true', "color('white')"],
      ]
    }
    photogrammetryMap.forEach((photogrammetryTileset) => {
      photogrammetryTileset.style = new Cesium.Cesium3DTileStyle({
        defines: {
          building: "${feature['building']}",
        },
        show: showStr,
        color: {
          conditions: conditions,
        },
      })
    })
  }

  let unwatchPhotogrammetryFilterForm: () => void
  const setupPhotogrammetryFilterFormWatch = (): void => {
    // filter form watch reserved for later
  }

  onUnmounted(() => {
    unsubPhotogrammetryHover()
    unsubPhotogrammetryLeave()
    unwatchPhotogrammetryFilterForm?.()
  })

  return {
    initPhotogrammetrys,
    addPhotogrammetryById,
    tooltip,
    filterPhotogrammetrys,
    removeActivePhotogrammetry,
  }
}
