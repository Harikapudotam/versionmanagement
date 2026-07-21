using salesorder.db as db from '../db/model';

service MyService {


    //  @restrict: [
    //     { grant: ['READ'], to: 'Customer' },
    //     { grant: ['READ','WRITE'], to: 'Buyer' },
    //     { grant: ['*'], to: 'Admin' }
    //   ]
    @cds.redirection.target
    entity SalesOrderHeaders as projection on db.SalesOrderHeader
        actions {
            action approve();
            action rejectt();
            action save();
        }

    entity SalesOrderItems   as projection on db.SalesOrderItem;
    entity UserAccess        as projection on db.UserAccess;

    @cds.search: {SalesOrderNo}
    entity SalesOrderNoVH    as
        projection on db.SalesOrderHeader {
            key SalesOrderNo,
                createdBy,
                companyCode,
                project
        };

    action   sendReport()      returns String;

    function whoAmI()          returns {
        role  : String;
        email : Boolean;
    };

    type ValueHelp {
        value : String;
    }

    function getCompanyCodes() returns array of ValueHelp;

    function getProjects()     returns array of ValueHelp;

}


annotate MyService.SalesOrderHeaders with {
    SalesOrderNo  @Common.Label: 'Sales Order No';
    VersionNo     @Common.Label: 'Version';
    CustomerName  @Common.Label: 'Customer Name';
    Factory       @Common.Label: 'Factory';
    RequestedDate @Common.Label: 'Requested Date';
    Status        @Common.Label: 'Status';
    TotalAmount   @Common.Label: 'Amount';
    createdBy     @Common.Label: 'Created By';
    companyCode   @Common.Label: 'Company Code';
    project       @Common.Label: 'Project';
};

annotate MyService.SalesOrderHeaders with @UI.LineItem: [
    {Value: SalesOrderNo},
    {Value: VersionNo},
    {Value: CustomerName},
    {Value: Factory},
    {Value: RequestedDate},
    {Value: Status},
    {Value: TotalAmount}
];


// annotate MyService.SalesOrderHeaders with {

//     SalesOrderNo @(Common.ValueList: {
//         CollectionPath : 'SalesOrderNoVH',
//         SearchSupported: true,
//         Parameters     : [{
//             $Type            : 'Common.ValueListParameterInOut',
//             LocalDataProperty: SalesOrderNo,
//             ValueListProperty: 'SalesOrderNo'
//         }]
//     });

// };
