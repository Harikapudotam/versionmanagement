using MyService as service from '../../srv/service';

annotate service.SalesOrderHeaders with @cds.search
 {

    SalesOrderNo @(
        Common.ValueList : {
            CollectionPath : 'SalesOrderNoVH',
            SearchSupported : true,
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : SalesOrderNo,
                    ValueListProperty : 'SalesOrderNo'
                }
            ]
        }
    );

};