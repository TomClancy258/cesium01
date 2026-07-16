import { onUnmounted, watch } from 'vue'
import * as Cesium from 'cesium'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import {
  OSMBuildingFilterForm,
  OSMBuildingHoveredProperties,
  OSMBuildingSelectedProperties, OSMBuildingTypeFilterValue
} from '@/views/aviation-situation/types/osm-building'
import {
  clearSelectedAviation,
  selectOSMBuilding
} from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
import { useOSMBuildingStore } from '@/stores/osm-building'
import {
  clearSelectedOSMBuildingHighlight
} from '@/views/aviation-situation/composables/highlight-manager/osm-building-highlight-manager'

export function useOSMBuilding(viewer) {
  const osmBuildingStore = useOSMBuildingStore()
  let osmBuildingTileset: Cesium.Cesium3DTileset | null = null
  const {
    tooltip,
    showTooltip: showOSMBuildingTooltip,
    hideTooltip: hideOSMBuildingTooltip,
  } = useAviationTooltip<OSMBuildingHoveredProperties>({
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

  const initOSMBuildings = () => {
    addOSMBuilding()
    subscribeOSMBuildingEvents()
    setupOSMBuildingFilterFormWatch()
  }

  const addOSMBuilding = async () => {
    osmBuildingTileset = viewer.value.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(96188),
    )
    osmBuildingTileset.sourceType = 'osmBuilding'
    // viewer.value.zoomTo(osmBuildingTileset);
  }

  let unsubOSMBuildingHover: () => void
  let unsubOSMBuildingLeave: () => void
  let unsubOSMBuildingLeftClick: () => void

  const subscribeOSMBuildingEvents = () => {
    unsubOSMBuildingHover = onCesiumEvent(
      'osmBuildingHover',
      (properties: OSMBuildingHoveredProperties, screenPosition: Cesium.Cartesian2) => {
        showOSMBuildingTooltip(screenPosition, properties)
      },
    )

    unsubOSMBuildingLeave = onCesiumEvent('osmBuildingLeave', () => {
      hideOSMBuildingTooltip()
    })

    unsubOSMBuildingLeftClick = onCesiumEvent(
      'osmBuildingLeftClick',
      (properties: OSMBuildingSelectedProperties, feature: Cesium.Cesium3DTileFeature) => {
        selectOSMBuilding(feature, properties)
      },
    )
  }

  const filterOSMBuildings = (
    newOSMBuildingFilterForm: OSMBuildingFilterForm,
    oldOSMBuildingFilterForm?: OSMBuildingFilterForm,
  ) => {
    if (
      oldOSMBuildingFilterForm &&
      newOSMBuildingFilterForm.colorByType !== oldOSMBuildingFilterForm.colorByType
    ) {
      clearSelectedAviation()
      clearSelectedOSMBuildingHighlight()
    }
    const types:OSMBuildingTypeFilterValue[]=newOSMBuildingFilterForm.types
    const colorByType:boolean=newOSMBuildingFilterForm.colorByType
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
    osmBuildingTileset.style = new Cesium.Cesium3DTileStyle({
      defines: {
        building: "${feature['building']}",
      },
      show:showStr,
      color: {
        conditions: conditions,
      },
    });
  }

  const snapshotOSMBuildingFilterForm = (): OSMBuildingFilterForm => ({
    types: [...osmBuildingStore.osmBuildingFilterForm.types],
    colorByType: osmBuildingStore.osmBuildingFilterForm.colorByType,
    colorByDistance: osmBuildingStore.osmBuildingFilterForm.colorByDistance,
  })

  let unwatchOSMBuildingFilterForm: () => void
  const setupOSMBuildingFilterFormWatch = (): void => {

    //为啥要有两种写法？
    // getter 写法更灵活，可以只监听一部分：
    //
    // // 只监听 money
    // watch(() => wallet.money, cb)

    //如果下面这样写，不加deep:true，则监听不到wallet.money=50的改变
    //但是这个的cb参数里新旧值都一样，无法获得旧值，不能写oldVal，准确说oldVal也指向newVal，它俩一样
    // watch(() => wallet, (不能写oldVal) => applyFilter())

    // 直接传对象适合「整个对象任何变化我都要知道」：
    //
    // watch(wallet, (newVal,可以写oldVal) => applyFilter()) 相当于自动加了deep:true，且可以获得新旧值
    unwatchOSMBuildingFilterForm = watch(
      snapshotOSMBuildingFilterForm,
      (newVal: OSMBuildingFilterForm, oldVal: OSMBuildingFilterForm | undefined) => {
        filterOSMBuildings(newVal, oldVal)
      },
    )
  }

  onUnmounted(() => {
    unsubOSMBuildingHover()
    unsubOSMBuildingLeave()
    unsubOSMBuildingLeftClick()

    unwatchOSMBuildingFilterForm()
  })

  return {
    initOSMBuildings,
    tooltip,
    filterOSMBuildings,
  }
}
