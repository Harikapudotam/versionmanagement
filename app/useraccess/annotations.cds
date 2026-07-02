using MyService as service from '../../srv/service';
annotate service.UserAccess with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'iasSubject',
                Value : iasSubject,
            },
            {
                $Type : 'UI.DataField',
                Label : 'fullName',
                Value : fullName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'role',
                Value : role,
            },
            {
                $Type : 'UI.DataField',
                Label : 'companies',
                Value : companies,
            },
            {
                $Type : 'UI.DataField',
                Label : 'projects',
                Value : projects,
            },
            {
                $Type : 'UI.DataField',
                Label : 'isActive',
                Value : isActive,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'iasSubject',
            Value : iasSubject,
        },
        {
            $Type : 'UI.DataField',
            Label : 'fullName',
            Value : fullName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'role',
            Value : role,
        },
        {
            $Type : 'UI.DataField',
            Label : 'companies',
            Value : companies,
        },
        {
            $Type : 'UI.DataField',
            Label : 'projects',
            Value : projects,
        },
    ],
);

