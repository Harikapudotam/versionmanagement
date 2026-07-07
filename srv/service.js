const cds = require('@sap/cds');
const { INSERT, SELECT, UPDATE, DELETE } = require('@sap/cds/lib/ql/cds-ql');
//const { sendEmail } = require("./utils/mail");
//const { buildSOTable } = require("./utils/template");
//const { getDestination } = require('@sap-cloud-sdk/connectivity');
module.exports = cds.service.impl(async function (srv) {
  const { SalesOrderHeaders, SalesOrderItems, UserAccess, SalesOrderNoVH } = srv.entities;
  async function getUserAccess(userId) {
    //replace harikapudota28@gmail.com with req.user.id to get the actual user email before deployment
    const access = await SELECT.from(UserAccess).where({ iasSubject: userId, isActive: true });
    if (access.length < 0) {
      return req.reject(403, 'User does not have access to this service.');
    }
    return access[0];
  }


  srv.on("UPDATE", SalesOrderHeaders, async (req) => {

    console.log("UPDATE Sales Order");

    const tx = cds.transaction(req);
    const newId = cds.utils.uuid();
    if (req.user.is("Admin")) {

      await tx.run(
        UPDATE(SalesOrderHeaders)
          .set({
            CustomerId: req.data.CustomerId,
            CustomerName: req.data.CustomerName,
            Factory: req.data.Factory,
            OrderDate: req.data.OrderDate,
            RequestedDate: req.data.RequestedDate,
            Currency: req.data.Currency,
            TotalAmount: req.data.TotalAmount,
            Status: req.data.Status,
            companyCode: req.data.companyCode,
            project: req.data.project
          })
          .where({
            ID: req.data.ID,
            SalesOrderNo: req.data.SalesOrderNo,
            VersionNo: req.data.VersionNo
          })
      );

      await tx.run(
        DELETE.from(SalesOrderItems).where({
          Header_ID: req.data.ID
        })
      );

      await tx.run(
        INSERT.into(SalesOrderItems).entries(
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
        )
      );
      return {
        ID: req.data.ID,
        SalesOrderNo: req.data.SalesOrderNo,
        VersionNo: req.data.VersionNo
      };
    }

    // -------------------------
    // Common Access Validation
    // -------------------------
    const userId = req.user.id;

    const access = await getUserAccess(userId);

    if (!access) {
      return req.reject(403, "User does not have access to this service.");
    }

    const companies = access.companies.split(",").map(c => c.trim());
    const projects = access.projects.split(",").map(p => p.trim());

    if (
      !companies.includes(req.data.companyCode) ||
      !projects.includes(req.data.project)
    ) {
      return req.reject(403, "Requisition outside your access scope");
    }
    // ==========================================================
    // BUYER -> Update existing version
    // ==========================================================
    if (req.user.is("Buyer")) {

      await tx.run(
        UPDATE(SalesOrderHeaders)
          .set({
            CustomerId: req.data.CustomerId,
            CustomerName: req.data.CustomerName,
            Factory: req.data.Factory,
            OrderDate: req.data.OrderDate,
            RequestedDate: req.data.RequestedDate,
            Currency: req.data.Currency,
            TotalAmount: req.data.TotalAmount,
            Status: "Submitted",
            companyCode: req.data.companyCode,
            project: req.data.project
          })
          .where({
            ID: req.data.ID,
            SalesOrderNo: req.data.SalesOrderNo,
            VersionNo: req.data.VersionNo
          })
      );

      await tx.run(
        DELETE.from(SalesOrderItems).where({
          Header_ID: req.data.ID
        })
      );

      await tx.run(
        INSERT.into(SalesOrderItems).entries(
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
        )
      );

      return {
        ID: req.data.ID,
        SalesOrderNo: req.data.SalesOrderNo,
        VersionNo: req.data.VersionNo
      };
    }
    // ==========================================================
    // CUSTOMER -> Create new version
    // ==========================================================
    if (req.user.is("Customer")) {

      const maxVersion =
        await SELECT.one`max(VersionNo) as maxVersion`
          .from(SalesOrderHeaders)
          .where({
            SalesOrderNo: req.data.SalesOrderNo
          });

      if (maxVersion.maxVersion !== req.data.VersionNo) {
        return req.reject(
          400,
          "There is already a changed version available. Please refresh and try again."
        );
      }

      await tx.run(
        INSERT.into(SalesOrderHeaders).entries({
          ID: newId,
          SalesOrderNo: req.data.SalesOrderNo,
          VersionNo: req.data.VersionNo + 1,
          Status: "OnHold",
          CustomerId: req.data.CustomerId,
          CustomerName: req.data.CustomerName,
          Factory: req.data.Factory,
          OrderDate: req.data.OrderDate,
          RequestedDate: req.data.RequestedDate,
          Currency: req.data.Currency,
          TotalAmount: req.data.TotalAmount,
          companyCode: req.data.companyCode,
          project: req.data.project,
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
        })
      );

      return {
        ID: newId,
        SalesOrderNo: req.data.SalesOrderNo,
        VersionNo: req.data.VersionNo + 1
      };
    }
    return req.reject(403, "Unauthorized role.");
  });

  srv.on('approve', SalesOrderHeaders, async (req) => {
    const userId = req.user.id || "harikapudota28@gmail.com";
    console.log('APPROVE RECORDS HAS TO BE CREATED', req.params[0]);
    //check first is it the admin or approver
    if (!req.user.is('Buyer') && !req.user.is('Admin'))
      return req.reject(403, 'Insufficient role');
    //Approver only from their scope records to be approved.

    const updateDataHeader = await SELECT.from(SalesOrderHeaders).where({ SalesOrderNo: req.params[0].SalesOrderNo, VersionNo: req.params[0].VersionNo });
    const updateDataItems = await SELECT.from(SalesOrderItems).where({ Header_ID: req.params[0].ID });
    const headerId = await SELECT.one`ID`.from(SalesOrderHeaders).where({ SalesOrderNo: req.params[0].SalesOrderNo, VersionNo: 1 });
    console.log(updateDataHeader);
    console.log(updateDataHeader.CustomerId);
    if (!req.user.is('Admin')) {
      const access = await getUserAccess(userId);
      console.log('User Access:', access);
      const companies = access.companies.split(',').map(s => s.trim());

      const projects = access.projects.split(',').map(s => s.trim());
      if (!companies.includes(updateDataHeader[0].companyCode) || !projects.includes(updateDataHeader[0].project))

        return req.reject(403, 'Requisition outside your access scope');

    }

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
    if (req.user.is("Admin")) {
      role = "Admin";
    } else if (req.user.is("Buyer")) {
      role = "Buyer";
    } else if (req.user.is("Customer")) {
      role = "Customer";
    }
    return {
      role: role,
      email: req.user.id
    };
  });

  //users only see allowed data. admins can see all data , for approvers they can the requesters data in their project and company. For requesters they can see their own data in their project and company.  
  srv.before("READ", SalesOrderHeaders, async (req) => {

    const userId = req.user.id;

    // Admin -> all records
    if (req.user.is("Admin")) {
      return;
    }

    // Customer -> only own records
    if (req.user.is("Customer")) {
      req.query.where({
        createdBy: userId
      });
      return;
    }

    // Buyer -> validate access and filter
    if (req.user.is("Buyer")) {

      const access = await getUserAccess(userId);

      if (!access) {
        return req.reject(403, "User does not have access.");
      }

      const companies = (access.companies || "")
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      const projects = (access.projects || "")
        .split(",")
        .map(p => p.trim())
        .filter(Boolean);

      if (!companies.length || !projects.length) {
        return req.reject(403, "No data access assigned.");
      }

      req.query.where({
        companyCode: { in: companies },
        project: { in: projects }
      });

      return;
    }

    return req.reject(403, "Unauthorized role.");
  });

  // ─── CREATE: validate company + project against UserAccess ───────── 
  srv.before('CREATE', SalesOrderHeaders, async (req) => {
    const { maxNumber } = await SELECT.one`max(SalesOrderNo) as maxNumber`.from(SalesOrderHeaders);
    let iNewNo = (!maxNumber ? 10000000 : Number(maxNumber) + 1);
    req.data.VersionNo = 1;
    req.data.Status = 'Submitted';
    req.data.SalesOrderNo = iNewNo;

    //1.check if it is admin

    if (req.user.is('Admin')) {
      req.data.createdBy = req.user.id;
      return;

    }
    const access = await getUserAccess(req.user.id);
    if (!access) {
      return req.reject(403, 'User does not have access to this service.');
    }
    //filtering companies and projects based on user access. If the company or project is not in the user's access list, reject the request.  
    const companies = access.companies.split(',').map(c => c.trim());
    const projects = access.projects.split(',').map(p => p.trim());


    if (!companies.includes(req.data.companyCode)) {
      return req.reject(403, 'User does not have access to this company.');
    }

    if (!projects.includes(req.data.project)) {
      return req.reject(403, 'User does not have access to this project.');
    }

    if (req.user.is('Buyer')) {
      return req.reject(403, 'Buyer cannot create');
    }



  });

  srv.before(['READ,CREATE', 'UPDATE', 'DELETE'], UserAccess, async (req) => {
    if (req.user.is('Admin')) {
      return;
    }
    return req.reject(403, 'User does not have access to this service.');
  })

  srv.on('getCompanyCodes', async (req) => {
    if (req.user.is("Admin")) {

      const companies = await SELECT.distinct
        .from(UserAccess)
        .columns("companies")
        .where({ companies: { "!=": null } });

      const result = await SELECT.from(UserAccess).columns("companies");

      const companySet = new Set();

      result.forEach(row => {

        if (row.companies) {
          row.companies
            .split(",")
            .map(c => c.trim())
            .forEach(c => companySet.add(c));
        }

      });

      return [...companySet].map(c => ({
        value: c
      }));
    }

    const user = req.user.id;
    // const user = "pudota.maryharika@ust.com"

    const access = await SELECT.one.from(UserAccess).where({
      iasSubject: user,
      isActive: true
    });

    console.log('User Access:', access);

    if (!access) {
      return [];
    }

    return access.companies
      .split(",")
      .map(c => ({
        value: c.trim()
      }));

  });

  srv.on("getProjects", async (req) => {



    if (req.user.is("Admin")) {

      const result = await SELECT.from(UserAccess)
        .columns("projects");

      const projectSet = new Set();

      result.forEach(row => {

        if (row.projects) {
          row.projects
            .split(",")
            .map(p => p.trim())
            .filter(p => p)
            .forEach(p => projectSet.add(p));
        }

      });

      return [...projectSet]
        .sort()
        .map(p => ({
          value: p
        }));
    }

    const access = await SELECT.one.from(UserAccess).where({
      iasSubject: req.user.id,
      isActive: true
    });

    if (!access || !access.projects) {
      return [];
    }

    return access.projects
      .split(",")
      .map(p => ({
        value: p.trim()
      }));
  });
  srv.on("READ", SalesOrderNoVH, async (req) => {

    const userId = req.user.id;

    if (req.user.is("Admin")) {
      return SELECT.distinct.from(SalesOrderHeaders).columns("SalesOrderNo");
    }

    if (req.user.is("Customer")) {
      return SELECT.distinct
        .from(SalesOrderHeaders)
        .columns("SalesOrderNo")
        .where({ createdBy: userId });
    }

    if (req.user.is("Buyer")) {

      const access = await getUserAccess(userId);

      const companies = (access.companies || "")
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      const projects = (access.projects || "")
        .split(",")
        .map(p => p.trim())
        .filter(Boolean);

      return SELECT.distinct
        .from(SalesOrderHeaders)
        .columns("SalesOrderNo")
        .where({
          companyCode: { in: companies },
          project: { in: projects }
        });
    }

    req.reject(403, "Unauthorized");
  });


  async function applyDataAccess(req) {

    const userId = req.user.id;
    //const userId = "pudota.maryharika@ust.com";

    if (req.user.is("Admin")) {
      return;
    }

    if (req.user.is("Customer")) {
      req.query.where({
        createdBy: userId
      });
      return;
    }

    if (req.user.is("Buyer")) {

      const access = await getUserAccess(userId);
      console.log('User Access:', access);

      if (!access) {
        return req.reject(403, "User does not have access.");
      }

      const companies = (access.companies || "")
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      const projects = (access.projects || "")
        .split(",")
        .map(p => p.trim())
        .filter(Boolean);

      req.query.where({
        companyCode: { in: companies },
        project: { in: projects }
      });
    }
    const rec = await SELECT.from(SalesOrderHeaders).columns('SalesOrderNo').where({
      companyCode: { in: companies },
      project: { in: projects }
    });
    console.log('Records:', rec);
    return rec;

  }
});