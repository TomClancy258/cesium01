import { onUnmounted, watch } from 'vue'
import * as Cesium from 'cesium'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import {
  PhotogrammetryFilterForm,
  PhotogrammetryHoveredProperties,
  PhotogrammetrySelectedProperties, PhotogrammetryTypeFilterValue
} from '@/views/aviation-situation/types/photogrammetry'
import {
  clearSelectedAviation,
  // selectPhotogrammetry
} from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
// import { usePhotogrammetryStore } from '@/stores/photogrammetry'
// import {
//   clearSelectedPhotogrammetryHighlight
// } from '@/views/aviation-situation/composables/highlight-manager/photogrammetry-highlight-manager'

export function usePhotogrammetry(viewer) {
  // const photogrammetryStore = usePhotogrammetryStore()
  let photogrammetryTileset: Cesium.Cesium3DTileset | null = null
  const {
    tooltip,
    showTooltip: showPhotogrammetryTooltip,
    hideTooltip: hidePhotogrammetryTooltip,
  } = useAviationTooltip<PhotogrammetryHoveredProperties>({
    name: '',
    type: {
      shop: '',
      building: '',
    },
    addr: {
      housenumber: '',
      street: '',
      city: '',
      state: '',
    },
    estimatedHeight: undefined,
    lngLatAlt: {
      longitude: 0,
      latitude: 0,
      height: 0,
    },
  })

  const initPhotogrammetrys = () => {
    addPhotogrammetrys()
    subscribePhotogrammetryEvents()
    setupPhotogrammetryFilterFormWatch()
  }

  const addPhotogrammetrys = async () => {
    photogrammetryTileset = viewer.value.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(354759),
    );
    photogrammetryTileset.sourceType = 'photogrammetry'
    viewer.value.zoomTo(photogrammetryTileset);
    viewer.value.zoomTo(photogrammetryTileset);
  }

  let unsubPhotogrammetryHover: () => void
  let unsubPhotogrammetryLeave: () => void
  let unsubPhotogrammetryLeftClick: () => void

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

    unsubPhotogrammetryLeftClick = onCesiumEvent(
      'photogrammetryLeftClick',
      (properties: PhotogrammetrySelectedProperties, feature: Cesium.Cesium3DTileFeature) => {
        selectPhotogrammetry(feature, properties)
      },
    )
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
      // clearSelectedPhotogrammetryHighlight()
    }
    const types:PhotogrammetryTypeFilterValue[]=newPhotogrammetryFilterForm.types
    const colorByType:boolean=newPhotogrammetryFilterForm.colorByType
    let showStr=''
    types.forEach((item,i)=>{
      if (item !== 'others') {
        showStr+="${building} === '"+item+"'"
      }else{
        showStr+="(${building} !== 'retail' && " +
          "${building} !== 'commercial' && " +
          "${building} !== 'yes' && " +
          "${building} !== 'industrial' && " +
          "${building} !== 'apartments' && " +
          "${building} !== 'residential' && " +
          "${building} !== 'office' && "+
          "${building} !== 'parking' && "+
          "${building} !== 'others')"
      }
      if (i !== types.length - 1) {
        showStr+=" || "
      }
    })
    if (types.length === 0) {
      showStr='false'
    }
    let conditions=[]
    if (colorByType) {
      conditions=[
        ["${building} === 'retail'", "color('#f4ea2a')"],
        ["${building} === 'commercial'", "color('skyblue', 0.5)"],
        ["${building} === 'yes'", "color('grey')"],
        ["${building} === 'industrial'", "color('indianred')"],
        ["${building} === 'apartments'", "color('lightslategrey')"],
        ["${building} === 'residential'", "color('lightgrey')"],
        ["${building} === 'office'", "color('lightsteelblue')"],
        ["${building} === 'parking'", "color('#b124ca')"],
        ["true", "color('white')"], // This is the else case
      ]
    }
    // console.log("showStr", showStr);
    photogrammetryTileset.style = new Cesium.Cesium3DTileStyle({
      defines: {
        building: "${feature['building']}",
      },
      show:showStr,
      color: {
        conditions: conditions,
      },
    });
  }

  // const snapshotPhotogrammetryFilterForm = (): PhotogrammetryFilterForm => ({
  //   types: [...photogrammetryStore.photogrammetryFilterForm.types],
  //   colorByType: photogrammetryStore.photogrammetryFilterForm.colorByType,
  //   colorByDistance: photogrammetryStore.photogrammetryFilterForm.colorByDistance,
  // })

  let unwatchPhotogrammetryFilterForm: () => void
  const setupPhotogrammetryFilterFormWatch = (): void => {
    // unwatchPhotogrammetryFilterForm = watch(
    //   snapshotPhotogrammetryFilterForm,
    //   (newVal: PhotogrammetryFilterForm, oldVal: PhotogrammetryFilterForm | undefined) => {
    //     filterPhotogrammetrys(newVal, oldVal)
    //   },
    // )
  }

  onUnmounted(() => {
    unsubPhotogrammetryHover()
    unsubPhotogrammetryLeave()
    unsubPhotogrammetryLeftClick()

    unwatchPhotogrammetryFilterForm()
  })

  return {
    initPhotogrammetrys,
    tooltip,
    filterPhotogrammetrys,
  }
}
