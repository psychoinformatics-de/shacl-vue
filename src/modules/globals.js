import { DASH } from './namespaces'


import BooleanSelectEditor from '../components/BooleanSelectEditor.vue'
import DatePickerEditor from '../components/DatePickerEditor.vue'
import DateTimePickerEditor from '../components/DateTimePickerEditor.vue'
import DetailsEditor from '../components/DetailsEditor.vue'
import InstancesSelectEditor from '../components/InstancesSelectEditor.vue'
import TextAreaEditor from '../components/TextAreaEditor.vue'
import TextFieldEditor from '../components/TextFieldEditor.vue'
import UnknownEditor from '../components/UnknownEditor.vue'
import URIEditor from '../components/URIEditor.vue'

// See DASH widgets: https://datashapes.org/forms.html#widgets

const components = {}
// components[DASH.AutoCompleteEditor.value] =  {
//     "str": "AutoCompleteEditor",
//     "comp": AutoCompleteEditor
// }
// components[DASH.BlankNodeEditor.value] =  {
//     "str": "BlankNodeEditor",
//     "comp": BlankNodeEditor
// }
components[DASH.BooleanSelectEditor.value] =  {
    "str": "BooleanSelectEditor",
    "comp": BooleanSelectEditor
}
components[DASH.DatePickerEditor.value] =  {
    "str": "DatePickerEditor",
    "comp": DatePickerEditor
}
components[DASH.DateTimePickerEditor.value] =  {
    "str": "DateTimePickerEditor",
    "comp": DateTimePickerEditor
}
components[DASH.DetailsEditor.value] =  {
    "str": "DetailsEditor",
    "comp": DetailsEditor
}
// components[DASH.EnumSelectEditor.value] =  {
//     "str": "EnumSelectEditor",
//     "comp": EnumSelectEditor
// }
components[DASH.InstancesSelectEditor.value] =  {
    "str": "InstancesSelectEditor",
    "comp": InstancesSelectEditor
}
// components[DASH.RichTextEditor.value] =  {
//     "str": "RichTextEditor",
//     "comp": RichTextEditor
// }
// components[DASH.SubClassEditor.value] =  {
//     "str": "SubClassEditor",
//     "comp": SubClassEditor
// }
components[DASH.TextAreaEditor.value] =  {
    "str": "TextAreaEditor",
    "comp": TextAreaEditor
}
// components[DASH.TextAreaWithLangEditor.value] =  {
//     "str": "TextAreaWithLangEditor",
//     "comp": TextAreaWithLangEditor
// }
components[DASH.TextFieldEditor.value] =  {
    "str": "TextFieldEditor",
    "comp": TextFieldEditor
}
// components[DASH.TextFieldWithLangEditor.value] =  {
//     "str": "TextFieldWithLangEditor",
//     "comp": TextFieldWithLangEditor
// }
components[DASH.URIEditor.value] =  {
    "str": "URIEditor",
    "comp": URIEditor
}

components["UnknownEditor"] =  {
    "str": "UnknownEditor",
    "comp": UnknownEditor
}

export const matchers = components