const cds = require('@sap/cds');
const { INSERT, SELECT, UPDATE, DELETE } = require('@sap/cds/lib/ql/cds-ql');
//const { sendEmail } = require("./utils/mail");
//const { buildSOTable } = require("./utils/template");
//const { getDestination } = require('@sap-cloud-sdk/connectivity');
module.exports = cds.service.impl(async function (srv) {
  const { SalesOrderHeaders, SalesOrderItems } = srv.entities;
  srv.before('CREATE', SalesOrderHeaders, async (req) => {
    const { maxNumber } = await SELECT.one`max(SalesOrderNo) as maxNumber`.from(SalesOrderHeaders);
    let iNewNo = (!maxNumber ? 10000000 : Number(maxNumber) + 1);
    req.data.VersionNo = 1;
    req.data.Status = 'Draft';
    req.data.SalesOrderNo = iNewNo;
  });
  srv.after('READ', SalesOrderHeaders, async (data) => {
    const records = Array.isArray(data) ? data : [data];
    for (const record of records) {
      record.CanApprove = false;
      record.CanReject = false;
      if (record.Status === 'OnHold') {
        record.CanApprove = true;
        record.CanReject = true;
      }
    }
  });
  srv.on('UPDATE', SalesOrderHeaders, async (req) => {
    //console.log('NEW RECORDS HAS TO BE CREATED')
    const newId = cds.utils.uuid();
    console.log(req.data);
    const tx = cds.transaction(req);

    //have to insert a new record here.
    //need to check if it is HP buyer it has to be updated else a new record will be created . need to write a if condition to check whether the user who has update is HP buyer or not. If HP buyer made changes to the initial record directly else create a new record
    //console.log('User role:', req.user.roles);
    //checking if any changed version is there: 
    //if no changed version , we can create , else throw an error message to user that there is already a changed version available. 
    console.log('Status', req.data.Status);
    const statusCheck = await SELECT.one`max(Status) as maxVersion`.from(SalesOrderHeaders).where({ SalesOrderNo: req.data.SalesOrderNo });
    console.log('Status Check:', statusCheck.maxVersion);
    console.log('Status Check:', req.data.isDraft);
    if (statusCheck.maxVersion === 'Draft') {

      if (req.data.isDraft === false) {
        console.log("creating record for the first time");
        await tx.run(UPDATE(SalesOrderHeaders)
          .set({
            CustomerId: req.data.CustomerId,
            CustomerName: req.data.CustomerName,
            Factory: req.data.Factory,
            OrderDate: req.data.OrderDate,
            RequestedDate: req.data.RequestedDate,
            Currency: req.data.Currency,
            TotalAmount: req.data.TotalAmount,
            Status: "Submitted"
          })
          .where({
            SalesOrderNo: req.data.SalesOrderNo,
            VersionNo: req.data.VersionNo,
            ID: req.data.ID
          }));

        await tx.run(DELETE.from(SalesOrderItems)
          .where({
            Header_ID: req.data.ID
          }));
        await tx.run(INSERT.into(SalesOrderItems).entries(

          req.data.Items.map(item => ({

            ID: cds.utils.uuid(),

            ItemNo: item.ItemNo,

            MaterialNo: item.MaterialNo,

            MaterialDescription: item.MaterialDescription,

            Quantity: item.Quantity,

            UOM: item.UOM,

            UnitPrice: item.UnitPrice,

            NetAmount: item.NetAmount,

            Header_ID: req.data.ID,

            Header_SalesOrderNo: req.data.SalesOrderNo,

            Header_VersionNo: req.data.VersionNo

          }))

        ));

      }
      else {
        console.log('Draft record is being updated');
        console.log('Draft record data:', req.data);
        await tx.run(UPDATE(SalesOrderHeaders)
          .set({
            CustomerId: req.data.CustomerId,
            CustomerName: req.data.CustomerName,
            Factory: req.data.Factory,
            OrderDate: req.data.OrderDate,
            RequestedDate: req.data.RequestedDate,
            Currency: req.data.Currency,
            TotalAmount: req.data.TotalAmount,
            Status: "Draft"
          })
          .where({
            SalesOrderNo: req.data.SalesOrderNo,
            VersionNo: req.data.VersionNo,
            ID: req.data.ID
          }));

        await tx.run(DELETE.from(SalesOrderItems)
          .where({
            Header_ID: req.data.ID
          }));
        await tx.run(INSERT.into(SalesOrderItems).entries(

          req.data.Items.map(item => ({

            ID: cds.utils.uuid(),

            ItemNo: item.ItemNo,

            MaterialNo: item.MaterialNo,

            MaterialDescription: item.MaterialDescription,

            Quantity: item.Quantity,

            UOM: item.UOM,

            UnitPrice: item.UnitPrice,

            NetAmount: item.NetAmount,

            Header_ID: req.data.ID,

            Header_SalesOrderNo: req.data.SalesOrderNo,

            Header_VersionNo: req.data.VersionNo

          }))

        ));
        //write logic to update the draft record here.
      }
    }
    else {
      if (req.user.is("Buyer")) {
        console.log('HP Buyer is updating the record');
        await tx.run(UPDATE(SalesOrderHeaders)
          .set({
            CustomerId: req.data.CustomerId,
            CustomerName: req.data.CustomerName,
            Factory: req.data.Factory,
            OrderDate: req.data.OrderDate,
            RequestedDate: req.data.RequestedDate,
            Currency: req.data.Currency,
            TotalAmount: req.data.TotalAmount,
            Status: "Submitted"
          })
          .where({
            SalesOrderNo: req.data.SalesOrderNo,
            VersionNo: req.data.VersionNo,
            ID: req.data.ID
          }));

        await tx.run(DELETE.from(SalesOrderItems)
          .where({
            Header_ID: req.data.ID
          }));
        await tx.run(INSERT.into(SalesOrderItems).entries(

          req.data.Items.map(item => ({

            ID: cds.utils.uuid(),

            ItemNo: item.ItemNo,

            MaterialNo: item.MaterialNo,

            MaterialDescription: item.MaterialDescription,

            Quantity: item.Quantity,

            UOM: item.UOM,

            UnitPrice: item.UnitPrice,

            NetAmount: item.NetAmount,

            Header_ID: req.data.ID,

            Header_SalesOrderNo: req.data.SalesOrderNo,

            Header_VersionNo: req.data.VersionNo

          }))

        ));
        return {
          ID: req.data.ID,
          SalesOrderNo: req.data.SalesOrderNo,
          VersionNo: req.data.VersionNo
        };
      }
      else {
        const maxVersion = await SELECT.one`max(VersionNo) as maxVersion`.from(SalesOrderHeaders).where({ SalesOrderNo: req.data.SalesOrderNo });
        if (maxVersion.maxVersion === req.data.VersionNo) {
          console.log(JSON.stringify(req.data.Items, null, 2));
          console.log('new');

          await tx.run(INSERT.into(SalesOrderHeaders).entries({
            SalesOrderNo: req.data.SalesOrderNo,
            VersionNo: req.data.VersionNo + 1,
            Status: 'OnHold',
            ID: newId,
            CustomerId: req.data.CustomerId,
            CustomerName: req.data.CustomerName,
            Factory: req.data.Factory,
            OrderDate: req.data.OrderDate,
            RequestedDate: req.data.RequestedDate,
            Currency: req.data.Currency,
            TotalAmount: req.data.TotalAmount,
            Items: req.data.Items.map(item => ({
              ID: cds.utils.uuid(),
              ItemNo: item.ItemNo,
              MaterialNo: item.MaterialNo,
              MaterialDescription: item.MaterialDescription,
              Quantity: item.Quantity,
              UOM: item.UOM,
              UnitPrice: item.UnitPrice,
              NetAmount: item.NetAmount
            }))
          }));

        } else {
          req.error(400, 'There is already a changed version available. Please refresh and try again.');
        }
        return {
          ID: newId,
          SalesOrderNo: req.data.SalesOrderNo,
          VersionNo: req.data.VersionNo + 1
        };

      }
    }
  });
  srv.on('approve', SalesOrderHeaders, async (req) => {
    console.log('APPROVE RECORDS HAS TO BE CREATED', req.params[0]);
    const updateDataHeader = await SELECT.from(SalesOrderHeaders).where({ SalesOrderNo: req.params[0].SalesOrderNo, VersionNo: req.params[0].VersionNo });
    const updateDataItems = await SELECT.from(SalesOrderItems).where({ Header_ID: req.params[0].ID });
    const headerId = await SELECT.one`ID`.from(SalesOrderHeaders).where({ SalesOrderNo: req.params[0].SalesOrderNo, VersionNo: 1 });
    console.log(updateDataHeader);
    console.log(updateDataHeader.CustomerId);
    await UPDATE(SalesOrderHeaders).set({ Status: 'Approved' }).where({ SalesOrderNo: req.params[0].SalesOrderNo, VersionNo: req.params[0].VersionNo });
    await UPDATE(SalesOrderHeaders)
      .set({
        CustomerId: updateDataHeader[0].CustomerId,
        CustomerName: updateDataHeader[0].CustomerName,
        Factory: updateDataHeader[0].Factory,
        OrderDate: updateDataHeader[0].OrderDate,
        RequestedDate: updateDataHeader[0].RequestedDate,
        Currency: updateDataHeader[0].Currency,
        TotalAmount: updateDataHeader[0].TotalAmount,
        Status: 'Submitted'
      })
      .where({
        SalesOrderNo: updateDataHeader[0].SalesOrderNo,
        VersionNo: 1
      });
    // await DELETE.from(SalesOrderHeaders)
    //   .where({
    //     HeaderID: req.params[0].ID, Header_VersionNo: 2
    //   });
    console.log('hEADER ID to be inserted', headerId.ID);
    console.log('Items to be inserted', updateDataItems);
    await DELETE.from(SalesOrderItems)
      .where({
        Header_ID: headerId.ID
      });
    await INSERT.into(SalesOrderItems).entries(
      updateDataItems.map(item => ({
        ID: cds.utils.uuid(),
        ItemNo: item.ItemNo,
        MaterialNo: item.MaterialNo,
        MaterialDescription: item.MaterialDescription,
        Quantity: item.Quantity,
        UOM: item.UOM,
        UnitPrice: item.UnitPrice,
        NetAmount: item.NetAmount,
        Header_ID: headerId.ID,
        Header_SalesOrderNo: updateDataHeader[0].SalesOrderNo,
        Header_VersionNo: 1
      }))
    );

    await DELETE.from(SalesOrderHeaders).where({ Status: 'Approved', VersionNo: 2 });
  });
  srv.on('rejectt', SalesOrderHeaders, async (req) => {
    await UPDATE(SalesOrderHeaders).set({ Status: 'Rejected' }).where({ SalesOrderNo: req.params[0].SalesOrderNo, VersionNo: 1 });
    await UPDATE(SalesOrderHeaders).set({ Status: 'Rejected' }).where({ SalesOrderNo: req.params[0].SalesOrderNo, VersionNo: 2 });
    await DELETE.from(SalesOrderHeaders).where({ Status: 'Rejected', VersionNo: 2 });
  }
  )
  srv.after('READ', SalesOrderHeaders, async (data) => {
    if (!Array.isArray(data)) return;
    const latestVersions = {};
    for (const row of data) {
      const key = row.SalesOrderNo;
      if (
        !latestVersions[key] ||
        row.VersionNo > latestVersions[key].VersionNo
      ) {
        latestVersions[key] = row;
      }
    }
    data.length = 0;
    data.push(...Object.values(latestVersions));
  });

  srv.on('sendReport', async (req) => {


    // Implement the logic to send the report here
    // query the DB where status is On Hold. If yes send an email
    const onHoldOrders = await SELECT.from(SalesOrderHeaders).where({ Status: 'OnHold' });
    console.log('On Hold Orders:', onHoldOrders);

    if (onHoldOrders.length > 0) {
      // Logic to send email
      console.log('Sending report email...');
      const html = buildSOTable(onHoldOrders);

      await sendEmail(
        "On Hold Sales Orders Report",
        html
      );

      return "Mail Sent Successfully";
    } else {
      console.log('No On Hold orders found. No email sent.');
    }
  });

  srv.on("whoAmI", async (req) => {

    let role = "CUSTOMER";

    console.log('roles', req.user.roles);
    if (req.user.is("Buyer")) {
      role = "HP_BUYER";
    }

    return {
      role: role,
      email: req.user.id
    };
  });

  srv.on("CREATE", SalesOrderHeaders, async (req) => {
    const newId = cds.utils.uuid();
    const tx = cds.transaction(req);

    const { maxNumber } =
      await SELECT.one`max(SalesOrderNo) as maxNumber`
        .from(SalesOrderHeaders);

    const newSalesOrderNo = !maxNumber ? 10000000 : Number(maxNumber) + 1;

    const status = req.data.isDraft ? "Draft" : "Submitted";
    console.log('Creating new Sales Order with Status Draft:', req.data);


    await tx.run(INSERT.into(SalesOrderHeaders).entries(
      {
        SalesOrderNo: newSalesOrderNo,
        VersionNo: 1,
        Status: status,
        ID: newId,
        CustomerId: req.data.CustomerId,
        CustomerName: req.data.CustomerName,
        Factory: req.data.Factory,
        OrderDate: req.data.OrderDate,
        RequestedDate: req.data.RequestedDate,
        Currency: req.data.Currency,
        TotalAmount: req.data.TotalAmount
      }
    ));
    await tx.run(INSERT.into(SalesOrderItems).entries(req.data.Items.map(item => ({
      ID: cds.utils.uuid(),
      ItemNo: item.ItemNo,
      MaterialNo: item.MaterialNo,
      MaterialDescription: item.MaterialDescription,
      Quantity: item.Quantity,
      UOM: item.UOM,
      UnitPrice: item.UnitPrice,
      NetAmount: item.NetAmount,
      Header_ID: newId,
      Header_SalesOrderNo: newSalesOrderNo,
      Header_VersionNo: 1
    }))));


    return {
      ID: newId,
      SalesOrderNo: newSalesOrderNo,
      VersionNo: 1
    };
  })
})