namespace salesorder.db;

using {managed} from '@sap/cds/common';

entity SalesOrderHeader : managed {
    key ID              : UUID;
    key VersionNo       : Integer @readonly;
    key SalesOrderNo    : Integer @readonly;
        CustomerId      : String(10);
        CustomerName    : String(10);
        Factory         : String(10);
        OrderDate       : Date;
        RequestedDate   : Date;

        Currency        : String(3);

        TotalAmount     : Decimal(10, 2);

        Status          : String(10) default 'Draft'; // Draft, Submitted, Approved, Rejected
        customer        : String(40);
        companyCode     : String(10); // validated against UserAccess
        approvedBy      : String(256);

        rejectedBy      : String(256);

        rejectionReason : String(500);
        project         : String(20);
        Items           : Composition of many SalesOrderItem
                              on Items.Header = $self;
}

entity SalesOrderItem : managed {
    key ID                  : UUID;

        Header              : Association to SalesOrderHeader;

        ItemNo              : Integer;

        MaterialNo          : String(10);
        MaterialDescription : String(255);

        Quantity            : Integer;
        UOM                 : String(5);
        UnitPrice           : Decimal(15, 2);
        NetAmount           : Decimal(15, 2);
}


entity UserAccess : managed {

    key ID         : UUID;

        iasSubject : String(256);

        fullName   : String(150);

        role       : String(20);

        companies  : String(500); // CSV: 'COMP-001,COMP-002'

        projects   : String(500); // CSV: 'PRJ-ALPHA,PRJ-BETA'

        isActive   : Boolean default true;

}
