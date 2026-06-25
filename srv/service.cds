using salesorder.db as db from '../db/model';

service MyService {
    function whoAmI() returns {
        role  : String;
        email : Boolean;
    };

    entity SalesOrderHeaders as projection on db.SalesOrderHeader
        actions {
            action approve();
            action rejectt();
            action save(data: SaveRequest);
            action submit(data: SaveRequest);
        }

    entity SalesOrderItems   as projection on db.SalesOrderItem;

    type Header {
        ID            : UUID;
        VersionNo     : Integer;
        SalesOrderNo  : Integer;
        CustomerId    : String(20);
        CustomerName  : String(100);
        Factory       : String(10);
        OrderDate     : Date;
        RequestedDate : Date;
        Currency      : String(3);
        TotalAmount   : Decimal(15, 2);
        Status        : String(20);
    }

    type Item {
        ID                  : UUID;
        ItemNo              : Integer;
        MaterialNo          : String(40);
        MaterialDescription : String(255);
        Quantity            : Decimal(15, 3);
        UOM                 : String(10);
        UnitPrice           : Decimal(15, 2);
        NetAmount           : Decimal(15, 2);
    }

    type SaveRequest {
        header : Header;
        items  : many Item;
    }
}

annotate MyService.SalesOrderHeaders with {
    SalesOrderNo  @Common.Label: 'Sales Order No';
    VersionNo     @Common.Label: 'Version';
    CustomerName  @Common.Label: 'Customer Name';
    Factory       @Common.Label: 'Factory';
    RequestedDate @Common.Label: 'Requested Date';
    Status        @Common.Label: 'Status';
    TotalAmount   @Common.Label: 'Amount';
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
