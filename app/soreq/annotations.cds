using MyService as service from '../../srv/service';

annotate service.SalesOrderHeaders with {

    CustomerName @(
        Common.ValueList: {
            CollectionPath: 'SalesOrderHeaders',
            SearchSupported: true,
            Parameters: [
                {
                    $Type: 'Common.ValueListParameterInOut',
                    LocalDataProperty: CustomerName,
                    ValueListProperty: 'CustomerName'
                }
            ]
        }
    );


 SalesOrderNo @(
        Common.ValueList: {
            CollectionPath: 'SalesOrderHeaders',
            SearchSupported: true,
            Parameters: [
                {
                    $Type: 'Common.ValueListParameterInOut',
                    LocalDataProperty: SalesOrderNo,
                    ValueListProperty: 'SalesOrderNo'
                }
            ]
        }
    );

};